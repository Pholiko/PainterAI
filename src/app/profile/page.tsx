"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, User as UserIcon, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        companyName: "",
        email: "",
        password: "",
        hourlyRate: "",
        materialCost: ""
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch full profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        companyName: data.companyName || "",
                        email: data.email || "",
                        hourlyRate: data.hourlyRate?.toString() || "",
                        materialCost: data.materialCost?.toString() || ""
                    }));
                }
            } catch (e) {
                console.error("Failed to fetch profile");
            }
        };

        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: "Profile updated successfully!" });
                // Update session data client-side if possible, or force refresh
                await update({
                    ...session,
                    user: {
                        ...session?.user,
                        name: formData.companyName,
                        email: formData.email
                    }
                });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: data.error || "Failed to update" });
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An error occurred" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <UserIcon className="w-8 h-8" /> Company Profile
            </h1>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your company details, pricing, and login credentials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Info */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="My Painting Co."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Pricing Settings */}
                        <div className="p-4 rounded-lg bg-secondary/20 border border-white/5 space-y-4">
                            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                                💶 Pricing Calculation Settings
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Hourly Rate (€/h)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.hourlyRate}
                                        onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                                        placeholder="e.g. 65.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Material Price (€/Liter)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.materialCost}
                                        onChange={e => setFormData({ ...formData, materialCost: e.target.value })}
                                        placeholder="e.g. 12.50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>New Password <span className="text-xs text-muted-foreground">(Leave blank to keep current)</span></Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                                {message.text}
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
