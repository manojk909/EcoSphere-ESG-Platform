import { PrismaClient } from '@prisma/client';

// Singleton pattern: reuse the same PrismaClient instance across the app
// to avoid exhausting database connections during development hot-reloads.
const prisma = new PrismaClient();

export default prisma;
