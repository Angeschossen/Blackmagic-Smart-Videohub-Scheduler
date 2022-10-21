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
    setupRoles: async function () {
        console.log("Setting up roles...");
        roles = new Map();

        // create necesarry roles
        for (const role of [
            new Role(1, false, "Admin", [permissions.PERMISSION_VIDEOHUB_EDIT, permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT, permissions.PERMISSION_ROLE_EDIT, permissions.PERMISSION_USER_EDIT]),
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

        // load custom roles
        const customRoles = await prismadb.role.findMany()
        for (const role of customRoles) {
            this.addRole(role);
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
        if (role == undefined || role.isRequired()) {
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
        await this.setupRoles();
        await videohubs.loadData();
        videohubs.connect();
    },
}