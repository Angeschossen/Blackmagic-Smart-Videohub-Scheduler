const PrismaClient = require('@prisma/client');
const fieldEncryptionMiddleware = require('prisma-field-encryption');

let global = {}

const prisma = global.prisma || new PrismaClient.PrismaClient()
prisma.$use(fieldEncryptionMiddleware.fieldEncryptionMiddleware());

if (process.env.NODE_ENV === 'development') global.prisma = prisma

module.exports = prisma;