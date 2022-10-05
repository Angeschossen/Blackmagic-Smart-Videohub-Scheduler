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

async function setupRoles() {
    console.log("Setting up roles...");
    for (const role of module.exports.roles) {
        await prisma.client.roles.upsert({
            where: {
                id: role.id,
            },
            create: {
                id: role.id,
                name: role.name,
                permissions: module.exports.permissions,
            },
            update: {
                name: role.name,
                permissions: module.exports.permissions,
            }
        });
    }
    console.log("Roles setup.");
}

module.exports = {
    setup: async function () {
        await setupRoles();

        const videohubs = require('./backend/videohubs');
        await videohubs.loadData();
        videohubs.connect();
    },
    permissions: [
        "videohub_output_schedule",
        "videohub_pushbuttons_edit"
    ],
    roles: [
        new Role(0, "Superuser", permissions),
        new Role(1, "Administrator", permissions),
        new Role(2, "User"),
    ],
}