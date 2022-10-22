const prismadb = require('../database/prisma');
const permissions = require('./authentication/Permissions');
const videohubs = require('./videohubs');
const socketio = require('./socketio');

class Role {
    constructor(id, editable, name, permissions) {
        this.id = id
        this.name = name
        this.outputs = []
        this.editable = editable

        this.setPermissions(permissions)
    }

    setPermissions(permissions) {
        this.permissions = permissions.map(perm => {
            return { permission: perm }
        })

        this.perms = new Set(permissions)
    }

    hasPermission(permission) {
        return this.perms.has(permission);
    }
}

async function createUser(user, role) {
    if (await prismadb.user.findUnique({
        where: {
            username: user.username,
        }
    }) == undefined) {
        console.log(`Creating user: ${user.username}`)
        if (user.password == undefined || user.username == undefined || user.password === "") {
            console.log(`Invalid user creation: ${user.username}`);
        } else {
            await prismadb.user.create({
                data: {
                    username: user.username,
                    password: user.password,
                    role_id: role?.id,
                }
            });
        }
    }
}

module.exports = {
    roles: undefined,
    ROLE_ADMIN_ID: 1,
    setupRoles: async function () {
        console.log("Setting up roles...");
        roles = new Map();

        // load custom roles
        const customRoles = await prismadb.role.findMany({
            include: {
                permissions: true,
            }
        })

        for (const role of customRoles) {
            this.addRole(role)
            const permissions = role.permissions.map(entry => entry.permission)
            this.setRolePermissions(role.id, permissions)
        }

        const adminRole = new Role(this.ROLE_ADMIN_ID, false, "Admin", [permissions.PERMISSION_VIDEOHUB_EDIT, permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT, permissions.PERMISSION_ROLE_EDIT, permissions.PERMISSION_USER_EDIT])
        roles.set(adminRole.id, adminRole)

        // create necesarry roles
        for (const role of [adminRole]) {
            // if not editable, then override
            if (roles.get(role.id) == undefined || !role.editable) {
                roles.set(role.id, role)

                await prismadb.role.upsert({
                    where: {
                        id: role.id,
                    },
                    create: {
                        id: role.id,
                        name: role.name,
                        editable: role.editable,
                    },
                    update: {
                        name: role.name,
                    },
                });

                await prismadb.rolePermission.deleteMany({
                    where: {
                        role_id: role.id,
                    }
                })

                await prismadb.rolePermission.createMany({
                    data: Array.from(role.permissions).map(entry => {
                        return { permission: entry.permission, role_id: role.id };
                    }),
                })
            }
        }

        await createUser({ username: "Admin", password: process.env.ADMIN_PASSWORD }, roles.get(1));
        const add = JSON.parse(process.env.USERS_ADD || "[]");
        for (const user of add) {
            await createUser(user);
        }

        console.log("Roles setup.");
    },
    getRoles() {
        return roles;
    },
    getRoleById(id) {
        return roles.get(id);
    },
    removeRole(id) {
        const role = roles.get(id)
        if (role == undefined || !role.editable) {
            return
        }

        roles.delete(id)
    },
    setRolePermissions(id, perms) {
        const prev = roles.get(id)
        if (prev != undefined && prev.editable) {
            for (const perm of perms) {
                if (permissions.toggleablePermissions.indexOf(perm) == -1) {
                    console.log("Non toggleable permission supplied at set perms.")
                    return
                }
            }

            prev.setPermissions(perms.filter(perm => permissions.toggleablePermissions.indexOf(perm) != -1))
        }
    },
    addRole(data) {
        const prev = roles.get(data.id)
        if (prev == undefined || prev.editable) {
            roles.set(data.id, new Role(data.id, true, data.name, []))
        }
    }, setup: async function () {
        await this.setupRoles()
        await videohubs.loadData()

        // make sure admin role has all outputs
        await prismadb.roleOutput.deleteMany({
            where: {
                role_id: this.ROLE_ADMIN_ID,
            }
        })

        // set
        const setOutputsAdmin = []
        videohubs.getVideohubs().forEach(hub => {
            hub.outputs.forEach(output => {
                setOutputsAdmin.push({
                    videohub_id: hub.id,
                    output_id: output.id,
                    role_id: this.ROLE_ADMIN_ID,
                })
            })
        })

        await prismadb.roleOutput.createMany({
            data: setOutputsAdmin
        })

        videohubs.connect()
    },
}