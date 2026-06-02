import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const prisma = new PrismaClient();

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    // Protect Route (Redundant with middleware but good for safety)
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/");
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            email: true,
            role: true,
            companyName: true
        }
    });

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <AdminDashboard initialUsers={users} />
        </div>
    );
}
