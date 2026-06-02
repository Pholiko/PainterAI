import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: {
                email: true,
                companyName: true,
                hourlyRate: true,
                materialCost: true
            }
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { companyName, email, password, hourlyRate, materialCost } = await req.json();
        const userId = (session.user as any).id;

        const dataToUpdate: any = {};
        if (companyName) dataToUpdate.companyName = companyName;
        // Parse numbers safely
        if (hourlyRate !== undefined && hourlyRate !== "") dataToUpdate.hourlyRate = parseFloat(hourlyRate);
        if (materialCost !== undefined && materialCost !== "") dataToUpdate.materialCost = parseFloat(materialCost);

        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== userId) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
            dataToUpdate.email = email;
        }
        if (password && password.trim() !== "") {
            dataToUpdate.passwordHash = await hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        });

        return NextResponse.json({
            success: true,
            user: {
                email: updatedUser.email,
                companyName: updatedUser.companyName,
                hourlyRate: updatedUser.hourlyRate,
                materialCost: updatedUser.materialCost
            }
        });

    } catch (error) {
        console.error("Profile update error", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
