"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Paintbrush, ArrowRight, Clock, Box, Loader2, FileText, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { generateOfferPDF } from "@/utils/pdfGenerator";

export default function Dashboard() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    e.preventDefault();

    const userProfile = {
      companyName: (session?.user as any)?.companyName || session?.user?.name,
      email: session?.user?.email
    };

    try {
      generateOfferPDF(project, userProfile);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Fehler beim Erstellen des PDFs.");
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate Stats
  const stats = {
    inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
    offerCreated: projects.filter(p => p.status === 'OFFER_CREATED').length,
    sent: projects.filter(p => p.status === 'SENT').length,
    total: projects.length
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Willkommen zurück, {(session.user as any)?.companyName || session.user?.name}.
          </p>
        </div>
        <Link href="/projects/create">
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" /> Neues Projekt
          </Button>
        </Link>
      </div>

      {/* Status Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* In Bearbeitung (Yellow) */}
        <Card className="glass-card bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-500">In Bearbeitung</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        {/* Angebot erstellt (Green) */}
        <Card className="glass-card bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-500">Angebot erstellt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offerCreated}</div>
          </CardContent>
        </Card>

        {/* An Kunden gesendet (Blue/Mail) */}
        <Card className="glass-card bg-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-500">An Kunden gesendet</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        {/* Alle Projekte (Total) */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alle Projekte</CardTitle>
            <Paintbrush className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List ("Letzte Angebote") */}
      <Card className="glass-card border-none bg-transparent shadow-none p-0">
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Letzte Angebote
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-12 text-center space-y-4 bg-secondary/10">
            <Box className="w-12 h-12 text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold">Keine Projekte vorhanden</h3>
              <p className="text-muted-foreground">Erstellen Sie Ihr erstes Projekt.</p>
            </div>
            <Link href="/projects/create">
              <Button variant="outline">Projekt erstellen</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* List Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
              <div className="col-span-6">Projekt / Kunde</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3 text-right">Aktionen</div>
            </div>

            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
              >
                <Link href={`/projects/${project.id}`}>
                  <Card className="glass-card hover:bg-white/5 transition-colors cursor-pointer border-white/10">
                    <div className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center">

                      {/* Thumbnail & Info */}
                      <div className="col-span-6 flex items-center gap-4 w-full">
                        <div className="w-16 h-12 bg-black/40 rounded overflow-hidden flex-shrink-0 relative">
                          {project.originalImage ? (
                            /* Note: This is an img tag for base64/url. For optimization use Next Image if configured */
                            <img src={project.originalImage} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Img</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg truncate">{project.clientName || "Unbekannter Kunde"}</h4>
                          <p className="text-sm text-muted-foreground">{project.name}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-3 w-full md:w-auto flex" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <select
                          className={`appearance-none px-3 py-1 pr-6 rounded-full text-xs font-medium border outline-none cursor-pointer
                            ${project.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              project.status === 'OFFER_CREATED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                project.status === 'SENT' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                  'bg-secondary text-muted-foreground border-transparent'
                            }`}
                          value={project.status}
                          onChange={(e) => handleStatusChange(project.id, e.target.value)}
                        >
                          <option value="IN_PROGRESS" className="bg-black text-white py-1">In Bearbeitung</option>
                          <option value="OFFER_CREATED" className="bg-black text-white py-1">Angebot erstellt</option>
                          <option value="SENT" className="bg-black text-white py-1">Gesendet</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 w-full flex items-center justify-end gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2 border-primary/20 hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => handleDownloadPDF(e, project)}
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </Button>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
