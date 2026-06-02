"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ComparisonView } from "@/components/ComparisonView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, Wand2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type Step = "color" | "upload" | "analyzing" | "generating" | "results";
type ColorChoice = { name: string; hex: string };

const PRESET_COLORS: ColorChoice[] = [
    { name: "Kaltweiß", hex: "#F3F4F6" },
    { name: "Anthrazit", hex: "#374151" },
    { name: "Eisblau", hex: "#60A5FA" },
    { name: "Salbeigrün", hex: "#A3B18A" },
    { name: "Terracotta", hex: "#E07A5F" },
    { name: "Beige", hex: "#EBE3D5" },
];

export default function CreateProjectPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("color");
    const [selectedColor, setSelectedColor] = useState<ColorChoice>(PRESET_COLORS[0]);
    const [customHex, setCustomHex] = useState("#000000");
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [clientName, setClientName] = useState("");

    const handleFileSelect = async (file: File) => {
        const imageUrl = URL.createObjectURL(file);
        setOriginalImage(imageUrl);
        setStep("analyzing");

        try {
            // 1. Analysis
            const formData = new FormData();
            formData.append("image", file);
            formData.append("targetColorHex", selectedColor.name === "Benutzerdefiniert" ? customHex : selectedColor.hex);
            formData.append("targetColorName", selectedColor.name);

            const analyzeRes = await fetch("/api/analyze", {
                method: "POST",
                body: formData
            });

            if (!analyzeRes.ok) throw new Error("Analysis failed");

            const analyzeData = await analyzeRes.json();
            setAnalysis(analyzeData);

            // 2. Nano Banana Pro Colorization
            setStep("generating");
            const colorizeRes = await fetch("/api/colorize", {
                method: "POST",
                body: formData
            });

            if (!colorizeRes.ok) throw new Error("Colorization failed");
            const colorizeData = await colorizeRes.json();

            setGeneratedImage(colorizeData.url);
            setStep("results");

        } catch (error: any) {
            console.error(error);
            alert(`Fehler: ${error?.message || "Unbekannter Fehler"}. Bitte überprüfen Sie Ihre API-Konfiguration.`);
            resetFlow();
        }
    };

    const resetFlow = () => {
        setStep("color");
        setOriginalImage(null);
        setGeneratedImage(null);
        setAnalysis(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Convert original blob URL to base64 for persistence in SQLite (Mock mode only)
            let origBase64 = originalImage;
            if (originalImage?.startsWith("blob:")) {
                const blob = await fetch(originalImage).then(r => r.blob());
                origBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: clientName ? `Projekt: ${clientName}` : `Project ${new Date().toLocaleDateString()}`,
                    clientName: clientName,
                    analysisData: analysis,
                    originalImage: origBase64,
                    generatedImage: generatedImage // In mock, this was likely already a URL or base64 returned by api
                })
            });

            if (res.ok) {
                router.push("/"); // Back to dashboard
            } else {
                alert("Failed to save");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-full w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <h1 className="text-3xl font-bold">New Project</h1>
            </div>

            <div className="flex-1 w-full max-w-5xl mx-auto min-h-[500px] flex flex-col items-center justify-start">
                <AnimatePresence mode="wait">

                    {step === "color" && (
                        <motion.div
                            key="color"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="w-full flex-1 flex flex-col items-center justify-center space-y-10 py-12"
                        >
                            <div className="text-center space-y-3">
                                <h2 className="text-3xl font-bold">Wählen Sie die gewünschte Wandfarbe</h2>
                                <p className="text-muted-foreground">in der die KI das Zimmer streichen soll</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-4xl">
                                {PRESET_COLORS.map((c) => (
                                    <div
                                        key={c.name}
                                        onClick={() => setSelectedColor(c)}
                                        className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 shadow-md ${selectedColor.name === c.name ? "border-primary scale-105 shadow-primary/30" : "border-border/50 hover:border-white/30"}`}
                                    >
                                        <div className="h-24 w-full" style={{ backgroundColor: c.hex }} />
                                        <div className="p-3 bg-secondary/30 text-center font-medium">
                                            {c.name}
                                        </div>
                                    </div>
                                ))}

                                {/* Custom Color Option */}
                                <div
                                    onClick={() => setSelectedColor({ name: "Benutzerdefiniert", hex: customHex })}
                                    className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 shadow-md ${selectedColor.name === "Benutzerdefiniert" ? "border-primary scale-105 shadow-primary/30" : "border-border/50 hover:border-white/30"}`}
                                >
                                    <div className="h-24 w-full flex items-center justify-center bg-black/20" style={{ backgroundColor: selectedColor.name === "Benutzerdefiniert" ? customHex : undefined }}>
                                        <input
                                            type="color"
                                            value={customHex}
                                            onChange={(e) => {
                                                setCustomHex(e.target.value);
                                                setSelectedColor({ name: "Benutzerdefiniert", hex: e.target.value });
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-12 h-12 rounded cursor-pointer pointer-events-auto"
                                        />
                                    </div>
                                    <div className="p-3 bg-secondary/30 text-center font-medium text-xs">
                                        Eigener HEX
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => setStep("upload")} size="lg" className="px-12 rounded-full py-6 text-lg mt-8 shadow-xl shadow-primary/20">
                                Weiter zum Upload
                            </Button>
                        </motion.div>
                    )}

                    {step === "upload" && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="w-full flex-col flex gap-6"
                        >
                            <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl border border-white/5">
                                <div>
                                    <span className="text-sm text-muted-foreground block">Gewählte Wunschfarbe:</span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: selectedColor.name === "Benutzerdefiniert" ? customHex : selectedColor.hex }} />
                                        <span className="font-medium text-lg">{selectedColor.name} {selectedColor.name === "Benutzerdefiniert" && `(${customHex})`}</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setStep("color")}>Farbe ändern</Button>
                            </div>
                            <UploadZone onFileSelect={handleFileSelect} />
                        </motion.div>
                    )}

                    {(step === "analyzing" || step === "generating") && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center space-y-8 mt-12"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                                {step === "analyzing" ? (
                                    <Wand2 className="w-16 h-16 text-primary animate-bounce" />
                                ) : (
                                    <Sparkles className="w-16 h-16 text-purple-400 animate-spin-slow" />
                                )}
                            </div>
                            <div className="space-y-2 text-center">
                                <h2 className="text-2xl font-bold">
                                    {step === "analyzing" ? "Wandmaße werden analysiert..." : `Wand wird in ${selectedColor.name} eingefärbt...`}
                                </h2>
                                <p className="text-muted-foreground">
                                    {step === "analyzing" 
                                        ? "GPT-4o schätzt Fläche, Zustand und Aufwand" 
                                        : "Die KI erstellt Ihr neues Bild..."}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === "results" && analysis && originalImage && generatedImage && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" onClick={resetFlow} className="gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Reset
                                </Button>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end mr-2">
                                        <span className="text-xs text-muted-foreground mr-1">Kunde / Projektname</span>
                                        <input
                                            className="bg-transparent border-b border-white/20 px-2 py-1 text-right focus:outline-none focus:border-primary text-sm w-48"
                                            placeholder="z.B. Schmidt Wohnzimmer"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Project
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full max-w-5xl mx-auto">
                                <ComparisonView
                                    beforeImage={originalImage}
                                    afterImage={generatedImage}
                                    className="h-auto md:h-[600px] object-cover"
                                />
                            </div>

                            <AnalysisResult {...analysis} />

                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
