const prismadb = require('../database/prismadb');

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

module.exports = {
    PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE: "VIDEOHUB_OUTPUT_SCHEDULE",
    PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT: "VIDEOHUB_PUSHBUTTONS_EDIT",
    permissions: [],
    roles: [],
    setupRoles: async function () {
        console.log("Setting up roles...");
        permissions = [
            module.exports.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE,
            module.exports.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT,
        ];

        roles = [
            new Role(1, "Admin", this.permissions),
            new Role(2, "Manager", this.permissions),
            new Role(3, "User", []),
        ];

        for (const role of roles) {
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
                    data: permissions.map((permission, _key) => {
                        return { permission: permission, role_id: role.id };
                    }),
                });
            }
        }

        if (await prismadb.credential.findUnique({
            where: {
                username: 'admin',
            }
        }) == undefined) {
            await prismadb.credential.create({
                data: {
                    username: 'admin',
                    password: process.env.ADMIN_PASSWORD,
                    role_id: roles[0].id,
                }
            });
        }

        console.log("Roles setup.");
    },
    setup: async function () {
        await this.setupRoles();

        const videohubs = require('./videohubs');
        await videohubs.loadData();
        videohubs.connect();
    },
}