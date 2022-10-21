const prismadb = require('../database/prisma');
const permissions = require('./authentication/Permissions');
const videohubs = require('./videohubs');
const socketio = require('./socketio');

class Role {
    constructor(id, editable, name, permissions) {
        this.id = id
        this.name = name
        this.permissions = new Set(permissions)
        this.outputs = []
        this.editable = editable
    }

    hasPermission(permission) {
        return this.permissions.has(permission);
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
        const customRoles = await prismadb.role.findMany()
        for (const role of customRoles) {
            this.addRole(role);
        }

        const adminRole = new Role(this.ROLE_ADMIN_ID, false, "Admin", [{permission: permissions.PERMISSION_VIDEOHUB_EDIT}, {permission:permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE}, {permission: permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT}, {permission: permissions.PERMISSION_ROLE_EDIT}, {permission: permissions.PERMISSION_USER_EDIT}])
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
            where:{
                role_id: this.ROLE_ADMIN_ID,
            }
        })

        // set
        const setOutputsAdmin = []
        videohubs.getVideohubs().forEach(hub => {
            hub.outputs.forEach(output=>{
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