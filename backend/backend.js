const prismadb = require('../database/prismadb');
const permissions = require('./authentication/Permissions');
const videohubs = require('./videohubs');
const socketio = require('./socketio');

class Role {
    constructor(id, name, permissions) {
        this.id = id;
        this.name = name;
        this.permissions = new Set(permissions);
        this.outputs = [];
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

async function createRole(role) {
    if (await prismadb.role.findUnique({
        where: {
            name: role.name,
        }
    }) == undefined) {
        const r = await prismadb.role.create({
            data: {
                name: role.name,
            }
        })

        return new Role(r.id, r.name, )
    }
}

module.exports = {
    roles: undefined,
    setupRoles: async function () {
        console.log("Setting up roles...");
        roles = new Map();

        const rolesAdd = JSON.parse(process.env.ROLES_ADD || "[]");
        for (const role of rolesAdd) {
            const name = role.name;
            if (await prismadb.role.findUnique({
                where: {
                    name: role.name,
                }
            }) == undefined) {
               
            }
        }

        for (const role of [
            new Role(1, "Admin", [permissions.PERMISSION_VIDEOHUB_EDIT, permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT, permissions.PERMISSION_ROLE_EDIT]),
            new Role(2, "Manager", [permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT]),
            new Role(3, "User", []),
        ]) {
            roles.set(role.id, role);

            const r = await prismadb.role.findUnique({
                where: {
                    id: role.id,
                },
                include: {
                    outputs: true
                }
            });

            if (r == undefined) {
                await prismadb.role.upsert({
                    where: {
                        id: role.id,
                    },
                    create: {
                        id: role.id,
                        name: role.name,
                    },
                    update: {
                        name: role.name,
                    },
                });

                await prismadb.rolePermission.createMany({
                    data: Array.from(role.permissions).map((permission, _key) => {
                        return { permission: permission, role_id: role.id };
                    }),
                });
            } else {
                role.outputs = r.outputs
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
    setup: async function () {
        await this.setupRoles();
        await videohubs.loadData();
        videohubs.connect();
    },
}