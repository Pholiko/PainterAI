"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Paintbrush, LogOut, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Paintbrush className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Painter AI
          </span>
        </Link>

        {session && (
          <nav className="flex items-center space-x-4">
            {/* Safe check for role */}
            {session.user && (session.user as any).role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
                  <Shield className="w-4 h-4" /> Admin
                </Button>
              </Link>
            )}

            <Link href="/profile" className="text-sm font-medium mr-2 hidden md:block hover:text-primary transition-colors">
              {(session.user as any).companyName || session.user?.name}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
