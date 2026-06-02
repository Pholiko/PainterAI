"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ComparisonView } from "@/components/ComparisonView";
import { useSession } from "next-auth/react";
import { generateOfferPDF } from "@/utils/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Calculator, Check, FileText } from "lucide-react";

export default function ProjectDetailPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Price calculator state
    const [stundensatz, setStundensatz] = useState<string>("");
    const [materialpreis, setMaterialpreis] = useState<string>("");
    const [rechnung, setRechnung] = useState<any>(null);

    // Corrected values from AnalysisResult (user can override paint liters & labor hours)
    const [correctedPaintLiters, setCorrectedPaintLiters] = useState<number>(0);
    const [correctedLaborHours, setCorrectedLaborHours] = useState<number>(0);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProject(data);
                    // Pre-fill with values from analysis if available
                    const ad = data.analysisData ? JSON.parse(data.analysisData) : null;
                    if (ad?.analysis?.calculation) {
                        const c = ad.analysis.calculation;
                        if (c.ratesUsed) {
                            setStundensatz(String(c.ratesUsed.hourly ?? "65"));
                            setMaterialpreis(String(c.ratesUsed.material ?? "12.50"));
                        }
                        setCorrectedPaintLiters(c.paintLiters ?? 0);
                        setCorrectedLaborHours(c.laborHours ?? 0);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProject();
    }, [params.id]);

    const handleBerechnen = () => {
        if (!project) return;
        const analysisData = project.analysisData ? JSON.parse(project.analysisData) : null;
        const calc = analysisData?.analysis?.calculation;
        if (!calc) return;

        const hourly = parseFloat(stundensatz) || 0;
        const matPrice = parseFloat(materialpreis) || 0;
        // Use corrected values if the user overrode them, otherwise fall back to KI values
        const paintLiters = correctedPaintLiters > 0 ? correctedPaintLiters : (calc.paintLiters ?? 0);
        const laborHours = correctedLaborHours > 0 ? correctedLaborHours : (calc.laborHours ?? 0);

        const materialCost = paintLiters * matPrice;
        const laborCost = laborHours * hourly;
        const netPrice = materialCost + laborCost;
        const tax = netPrice * 0.19;
        const totalPrice = netPrice + tax;

        setRechnung({ paintLiters, laborHours, materialCost, laborCost, netPrice, tax, totalPrice });
    };

    const handleDownloadPDF = () => {
        if (!project) return;
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

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!project) {
        return <div className="text-center py-20 text-muted-foreground">Projekt nicht gefunden</div>;
    }

    const analysisData = project.analysisData ? JSON.parse(project.analysisData) : null;
    const details = analysisData?.analysis?.details;

    return (
        <div className="container mx-auto p-8 max-w-5xl animate-in fade-in duration-500">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
                <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
            </Button>

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <div className="text-sm text-muted-foreground">
                    Erstellt: {new Date(project.createdAt).toLocaleDateString("de-DE")}
                </div>
            </div>

            <div className="grid gap-8">

                {/* Visuals */}
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Visualisierung</h2>
                    {project.originalImage ? (
                        <div className="w-full max-w-5xl mx-auto">
                            <ComparisonView
                                beforeImage={project.originalImage}
                                afterImage={project.generatedImage ?? project.originalImage}
                                className="h-auto md:h-[600px] object-cover"
                            />
                        </div>
                    ) : (
                        <div className="p-12 border border-dashed border-white/10 rounded-xl text-center text-muted-foreground">
                            Keine Bilder gespeichert.
                        </div>
                    )}
                </div>

                {/* Analysis Report */}
                {analysisData && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Analysebericht</h2>
                        <AnalysisResult
                            {...analysisData}
                            onValuesChange={(paint, labor) => {
                                setCorrectedPaintLiters(paint);
                                setCorrectedLaborHours(labor);
                            }}
                        />
                    </div>
                )}

                {/* Manual Price Calculator */}
                {analysisData?.analysis?.calculation && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Preiskalkulation</h2>
                        <Card className="glass-card border-white/10 bg-secondary/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-primary" />
                                    Kosten manuell anpassen
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Stundensatz (€/Std)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={stundensatz}
                                            onChange={(e) => setStundensatz(e.target.value)}
                                            placeholder="z.B. 65"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Materialpreis (€/Liter)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={materialpreis}
                                            onChange={(e) => setMaterialpreis(e.target.value)}
                                            placeholder="z.B. 12.50"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Info row – reflects manual corrections */}
                                <div className="text-xs text-muted-foreground flex gap-6 flex-wrap">
                                    <span>Farbe: <span className="text-foreground font-medium">{correctedPaintLiters} L</span>
                                        {correctedPaintLiters !== analysisData.analysis.calculation.paintLiters && (
                                            <span className="ml-1 text-amber-400">(korrigiert)</span>
                                        )}
                                    </span>
                                    <span>Arbeitszeit: <span className="text-foreground font-medium">{correctedLaborHours} Std</span>
                                        {correctedLaborHours !== analysisData.analysis.calculation.laborHours && (
                                            <span className="ml-1 text-amber-400">(korrigiert)</span>
                                        )}
                                    </span>
                                    <span className="text-muted-foreground/60">(aus KI-Analyse, ggf. korrigiert)</span>
                                </div>

                                <Button onClick={handleBerechnen} className="w-full gap-2 shadow-md shadow-primary/20">
                                    <Calculator className="w-4 h-4" />
                                    Preis berechnen
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Calculated Invoice */}
                        {rechnung && (
                            <Card className="glass-card border-primary/20 bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Check className="w-4 h-4 text-primary" />
                                        Aktualisierte Rechnung
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                        <span className="text-muted-foreground">Materialkosten ({rechnung.paintLiters} L × {parseFloat(materialpreis).toFixed(2)} €):</span>
                                        <span className="text-right font-medium">{rechnung.materialCost.toFixed(2)} €</span>

                                        <span className="text-muted-foreground">Arbeitskosten ({rechnung.laborHours} Std × {parseFloat(stundensatz).toFixed(2)} €):</span>
                                        <span className="text-right font-medium">{rechnung.laborCost.toFixed(2)} €</span>

                                        <span className="text-muted-foreground border-t border-white/10 pt-2">Nettobetrag:</span>
                                        <span className="text-right font-medium border-t border-white/10 pt-2">{rechnung.netPrice.toFixed(2)} €</span>

                                        <span className="text-muted-foreground">MwSt. (19%):</span>
                                        <span className="text-right font-medium">{rechnung.tax.toFixed(2)} €</span>

                                        <span className="font-bold text-base border-t border-white/20 pt-2">Gesamtbetrag:</span>
                                        <span className="text-right font-bold text-base text-primary border-t border-white/20 pt-2">{rechnung.totalPrice.toFixed(2)} €</span>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-primary/20">
                                        <Button onClick={handleDownloadPDF} className="w-full gap-2 border border-primary text-primary hover:bg-primary/20" variant="outline">
                                            <FileText className="w-4 h-4" />
                                            PDF Angebot Herunterladen
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
