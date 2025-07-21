import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'query', },
        { emit: 'event', level: 'info' },
    ],
    errorFormat: 'pretty',
    transactionOptions: {
        timeout: 5000, // Set a timeout for transactions
    }
});

if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        console.log(`Query: ${e.query} \nParams: ${e.params} \nDuration: ${e.duration}ms`);
    });
}

export async function isConnected(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

export default prisma;