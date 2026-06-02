"use client";

import { useState } from "react";
import { User } from "@prisma/client"; // Or interface
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Shadcn table if available, or just div
import { Loader2, Plus, Building, Trash2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Minimal Table definition if shadcn table not installed or complicated
// But assuming we want premium UI. I'll use simple divs/grid for now if I didn't install table. 
// I didn't install table component specifically (npx shadcn add table).
// So I will stick to standard HTML table or Card list.

interface AdminDashboardProps {
    initialUsers: any[];
}

export function AdminDashboard({ initialUsers }: AdminDashboardProps) {
    const [users, setUsers] = useState(initialUsers);
    const [formData, setFormData] = useState({ email: "", password: "", companyName: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ email: "", companyName: "" });

    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const newUser = await res.json();
                setUsers([newUser, ...users]);
                setFormData({ email: "", password: "", companyName: "" });
                router.refresh();
            } else {
                alert("Failed to create user");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this company?")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
                router.refresh();
            } else {
                alert("Failed to delete");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (user: any) => {
        setEditingId(user.id);
        setEditForm({ email: user.email, companyName: user.companyName });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                const updated = await res.json();
                setUsers(users.map(u => u.id === id ? { ...u, ...updated } : u));
                setEditingId(null);
                router.refresh();
            } else {
                alert("Failed to update");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-1 glass-card h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5" /> New Company
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                placeholder="Company Name"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                required
                            />
                            <Input
                                placeholder="Email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Input
                                placeholder="Password"
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5" /> Registered Companies
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-white/5 transition-all hover:bg-secondary/30">
                                    {editingId === user.id ? (
                                        <div className="flex-1 grid gap-2 mr-4">
                                            <Input
                                                value={editForm.companyName}
                                                onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                                                placeholder="Company Name"
                                            />
                                            <Input
                                                value={editForm.email}
                                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                placeholder="Email"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="font-semibold text-lg">{user.companyName || "N/A"}</h4>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <div className="mt-1 text-xs text-muted-foreground/50">
                                                ID: {user.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        {editingId === user.id ? (
                                            <>
                                                <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-400 hover:bg-green-500/10" onClick={() => saveEdit(user.id)}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={cancelEdit}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-xs px-2 py-1 rounded bg-primary/20 text-primary uppercase font-bold mr-2">
                                                    {user.role}
                                                </div>
                                                {user.role !== "ADMIN" && (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" onClick={() => startEdit(user)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <p className="text-muted-foreground text-center py-8">No companies registered yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

