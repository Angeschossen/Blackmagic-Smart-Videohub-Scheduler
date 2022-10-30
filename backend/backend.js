const prismadb = require('../database/prisma');
const permissions = require('./authentication/Permissions');
const videohubs = require('./videohubs');

class Role {
    constructor(id, editable, name, permissions, outputs) {
        this.id = id
        this.name = name
        this.outputs = outputs
        this.editable = editable

        this.setPermissions(permissions.map(perm => {
            return {
                permission: perm,
                role_id: id,
            }
        }))
    }

    setPermissions(permissions) {
        this.permissions = permissions
        this.perms = new Set(permissions.map(perm => perm.permission))
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
        console.log("Setting up roles...")
        roles = new Map()

        // load created roles
        const customRoles = await prismadb.role.findMany({
            include: {
                permissions: true,
                outputs: true,
            }
        })

        for (const role of customRoles) {
            this.addRole(role)
        }

        const adminRole = new Role(this.ROLE_ADMIN_ID, false, "Admin", [permissions.PERMISSION_VIDEOHUB_EDIT, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT, permissions.PERMISSION_ROLE_EDIT, permissions.PERMISSION_USER_EDIT])
        roles.set(adminRole.id, adminRole) // override

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
                        editable: role.editable, // disallow manual manipulation
                    },
                })

                await this.setRolePermissions(role.id, role.permissions, true)
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
    async setRolePermissions(roleId, perms, allowNonEditable) {
        console.log("Setting role perms for role: " + roleId)

        const role = roles.get(roleId)
        if (role == undefined || (!role.editable && !allowNonEditable)) {
            return false
        }

        // check toggleable
        if (!allowNonEditable) {
            for (const perm of perms) {
                if (permissions.toggleablePermissions.indexOf(perm.permission) == -1) {
                    console.log(`Non toggleable permission supplied at set perms: ${perm.permission}`)
                    return false
                }
            }

            // filter toggleable
            perms = perms.filter(perm => permissions.toggleablePermissions.indexOf(perm.permission) != -1)
        }

        // delete
        await prismadb.rolePermission.deleteMany({
            where: {
                role_id: role.id,
            }
        })

        // create
        await prismadb.rolePermission.createMany({
            data: perms
        })

        role.setPermissions(perms)
        return true
    }, setRoleOutputs: async function (roleId, videohubId, outputs, allowNonEditable) {
        console.log("Setting role outputs for role: " + roleId)

        const role = roles.get(roleId)
        if (role == undefined || (!role.editable && !allowNonEditable)) {
            return false
        }

        // delete
        await prismadb.roleOutput.deleteMany({
            where: {
                role_id: role.id,
                videohub_id: videohubId,
            }
        })

        // create
        await prismadb.roleOutput.createMany({
            data: outputs.filter(output => output.videohub_id === videohubId && output.role_id === roleId)
        })

        role.outputs = outputs
        return true
    },
    addRole(data) {
        const prev = roles.get(data.id)
        if (prev == undefined || prev.editable) {
            roles.set(data.id, new Role(data.id, true, data.name, data.permissions?.map(perm => perm.permission) || [], data.outputs || []))
        }
    }, setup: async function () {
        await this.setupRoles()
        await videohubs.setup()

        // set
        videohubs.getVideohubs().forEach(async hub => {
            await this.setRoleOutputs(this.ROLE_ADMIN_ID, hub.id, hub.outputs.map(output => {
                return {
                    videohub_id: hub.id,
                    output_id: output.id,
                    role_id: this.ROLE_ADMIN_ID,
                }
            }), true)
        })
    },
}