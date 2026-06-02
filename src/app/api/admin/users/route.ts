import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                email: true,
                role: true,
                companyName: true,
                createdAt: true
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { email, password, companyName } = await req.json();

        if (!email || !password || !companyName) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // In a real app, hash the password using bcrypt here!
        // For this prototype/MVP we assume the client sends it or we store it (mock mode).
        // Re-installing bcryptjs in API seems overkill but good practice. 
        // I installed it earlier.
        const { hash } = require("bcryptjs");
        const passwordHash = await hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: passwordHash,
                role: "COMPANY",
                companyName
            }
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
