import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Needed for dynamic route parameter in Next.js 13+ App Router
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const id = params.id;
        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const id = params.id;
        const data = await req.json(); // Expecting { companyName, email, ... }

        // Sanitize update data (don't allow updating password via this simple route for now unless requested)
        const updateData: any = {};
        if (data.companyName) updateData.companyName = data.companyName;
        if (data.email) updateData.email = data.email;

        // If password is sent, we would need to hash it.
        // For MVP edit, user mainly wants to change name/email likely.

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update error", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
