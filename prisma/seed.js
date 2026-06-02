const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "file:./dev.db"
        }
    }
});

async function main() {
    const adminEmail = 'admin@painterai.com';
    // In a real app, hash this password! e.g. using bcrypt
    // For this mock/demo, we'll store plain text or simple hash
    // Using simple string for now as NextAuth Credential provider will check it
    const passwordHash = 'admin123';

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: passwordHash,
            role: 'ADMIN',
            companyName: 'Painter AI HQ'
        },
    });

    console.log({ admin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
