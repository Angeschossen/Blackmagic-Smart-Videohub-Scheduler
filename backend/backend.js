const prisma = require('../database/prisma');

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
    permissions: [],
    roles: [],
    setupRoles: async function () {
        console.log("Setting up roles...");
        permissions = [
            "videohub_output_schedule",
            "videohub_pushbuttons_edit"
        ];

        roles = [
            new Role(1, "Superuser", this.permissions),
            new Role(2, "Administrator", this.permissions),
            new Role(3, "User", this.permissions),
        ];

        for (const role of roles) {
            if (await prisma.client.role.findUnique({
                where: {
                    id: role.id,
                }
            }) == undefined) {
                await prisma.client.role.upsert({
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

                await prisma.client.rolePermission.createMany({
                    data: permissions.map((permission, _key)=>{
                        return {permission: permission, role_id: role.id};
                    }),
                });
            }
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