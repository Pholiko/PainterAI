import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { email, password, companyName } = await req.json();

        if (!email || !password || !companyName) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check existing
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }

        const passwordHash = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                companyName,
                role: "COMPANY"
            }
        });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Registration error", error);
        return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }
}
