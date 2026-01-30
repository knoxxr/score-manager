
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Create adapter
// Handle relative path in DATABASE_URL (e.g. "file:./dev.db")
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
const dbPath = dbUrl.replace('file:', '')

// Ensure absolute path because better-sqlite3 logic might vary
const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)

// Pass config object directly to PrismaBetterSqlite3 as per d.ts signature
// constructor(config: BetterSQLite3InputParams, ...)
// It seems it takes the config needed to create the DB connection internally, OR we pass the db file path as part of config?
// Wait, looking at d.ts: `constructor(config: BetterSQLite3InputParams` where Params is `Options & { url: ... }`.
// So we don't pass a `new Database()` instance. We pass the config.

const adapter = new PrismaBetterSqlite3({
    url: absoluteDbPath
})

// Check if we have a stale instance in globalThis that's missing new models
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).questionType) {
    console.log('Stale Prisma instance detected (missing questionType), clearing for fresh client...');
    globalForPrisma.prisma = undefined as any;
}

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
