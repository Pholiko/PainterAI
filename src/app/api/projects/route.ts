import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const projects = await prisma.project.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, clientName, analysisData, originalImage, generatedImage } = body;

        if (!name || !originalImage) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                userId: (session.user as any).id,
                name,
                clientName,
                originalImage,
                generatedImage,
                analysisData: JSON.stringify(analysisData),
                status: "IN_PROGRESS"
            }
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("Create project error", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
