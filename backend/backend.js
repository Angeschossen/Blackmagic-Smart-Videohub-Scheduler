const prismadb = require('../database/prismadb');
const permissions = require('./authentication/Permissions');
const videohubs = require('./videohubs');
const socketio = require('./socketio');

class Role {
    constructor(id, name, permissions) {
        this.id = id;
        this.name = name;
        this.permissions = new Set(permissions);
    }

    hasPermission(permission) {
        return this.permissions.has(permission);
    }
}

async function createUser(user, role) {
    if (await prismadb.credential.findUnique({
        where: {
            username: user.username,
        }
    }) == undefined) {
        console.log(`Creating user: ${user.username}`)
        if (user.password == undefined || user.username == undefined || user.password === "") {
            console.log(`Invalid user creation: ${user.username}`);
        } else {
            await prismadb.credential.create({
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
    setupRoles: async function () {
        console.log("Setting up roles...");
        roles = new Map();

        for (const role of [
            new Role(1, "Admin", [permissions.PERMISSION_VIDEOHUB_EDIT, permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT]),
            new Role(2, "Manager", [permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT]),
            new Role(3, "User", []),
        ]) {
            roles.set(role.id, role);

            if (await prismadb.role.findUnique({
                where: {
                    id: role.id,
                }
            }) == undefined) {
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