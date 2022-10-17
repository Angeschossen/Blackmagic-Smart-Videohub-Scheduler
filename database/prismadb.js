const PrismaClient = require('@prisma/client');
const fieldEncryptionMiddleware = require('prisma-field-encryption');

if (global.prisma == undefined) {
    global.prisma = new PrismaClient.PrismaClient();
    global.prisma.$use(fieldEncryptionMiddleware.fieldEncryptionMiddleware());
}

module.exports = global.prisma;