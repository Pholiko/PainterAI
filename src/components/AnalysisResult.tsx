"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, PaintBucket, Ruler, Clock, Move, Pencil, X } from "lucide-react";

interface AnalysisResultProps {
    analysis?: {
        dimensions?: {
            area?: number;
            height?: number;
            wallWidth?: number;
            wallHeight?: number;
            tolerancePercent?: number;
        };
        details?: {
            condition?: string;
            steps?: string[];
        };
        calculation?: {
            paintLiters?: number;
            laborHours?: number;
            materialCost?: number;
            laborCost?: number;
            netPrice?: number;
            tax?: number;
            totalPrice?: number;
        };
    };
    /** Called whenever the user saves corrected paintLiters or laborHours */
    onValuesChange?: (paintLiters: number, laborHours: number) => void;
}

export function AnalysisResult({ analysis, onValuesChange }: AnalysisResultProps) {
    const dims = analysis?.dimensions;
    const calc = analysis?.calculation;
    const details = analysis?.details;

    const area = dims?.area ?? 0;
    const wallWidth = dims?.wallWidth;
    const wallHeight = dims?.wallHeight;
    const tolerance = dims?.tolerancePercent ?? 15;

    // Editable values – start from KI-Analyse
    const [paintLiters, setPaintLiters] = useState<number>(calc?.paintLiters ?? 0);
    const [laborHours, setLaborHours] = useState<number>(calc?.laborHours ?? 0);

    // Edit mode flags
    const [editingPaint, setEditingPaint] = useState(false);
    const [editingLabor, setEditingLabor] = useState(false);

    // Temp edit values
    const [tempPaint, setTempPaint] = useState<string>(String(calc?.paintLiters ?? 0));
    const [tempLabor, setTempLabor] = useState<string>(String(calc?.laborHours ?? 0));

    const savePaint = () => {
        const val = parseFloat(tempPaint);
        if (!isNaN(val) && val >= 0) {
            setPaintLiters(val);
            onValuesChange?.(val, laborHours);
        }
        setEditingPaint(false);
    };

    const saveLabor = () => {
        const val = parseFloat(tempLabor);
        if (!isNaN(val) && val >= 0) {
            setLaborHours(val);
            onValuesChange?.(paintLiters, val);
        }
        setEditingLabor(false);
    };

    const cancelPaint = () => {
        setTempPaint(String(paintLiters));
        setEditingPaint(false);
    };

    const cancelLabor = () => {
        setTempLabor(String(laborHours));
        setEditingLabor(false);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Wall Dimensions Card */}
                <Card className="glass-card shadow-sm border-0 bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Wandmaße</CardTitle>
                        <Move className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {wallWidth && wallHeight ? (
                            <>
                                <div className="text-2xl font-bold">
                                    {wallWidth.toFixed(1)}m × {wallHeight.toFixed(1)}m
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Geschätzt (±{tolerance}% Abweichung)
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{area} m²</div>
                                <p className="text-xs text-muted-foreground">Geschätzte Fläche</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Wall Area Card */}
                <Card className="glass-card shadow-sm border-0 bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Wandfläche</CardTitle>
                        <Ruler className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{area} m²</div>
                        <p className="text-xs text-muted-foreground">±{tolerance}% Abweichung</p>
                    </CardContent>
                </Card>

                {/* Paint Required Card – editable */}
                <Card className="glass-card shadow-sm border-0 bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Farbe benötigt</CardTitle>
                        <div className="flex items-center gap-1">
                            {!editingPaint && (
                                <button
                                    onClick={() => { setTempPaint(String(paintLiters)); setEditingPaint(true); }}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    title="Wert korrigieren"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                </button>
                            )}
                            <PaintBucket className="w-4 h-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {editingPaint ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={tempPaint}
                                        onChange={(e) => setTempPaint(e.target.value)}
                                        autoFocus
                                        className="w-full bg-background/60 border border-primary/40 rounded px-2 py-1 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-primary/60"
                                    />
                                    <span className="text-lg font-bold text-muted-foreground">L</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={savePaint} className="flex-1 text-xs bg-primary/80 hover:bg-primary text-white rounded px-2 py-1 transition-colors flex items-center justify-center gap-1">
                                        <Check className="w-3 h-3" /> Speichern
                                    </button>
                                    <button onClick={cancelPaint} className="flex-1 text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors flex items-center justify-center gap-1">
                                        <X className="w-3 h-3" /> Abbrechen
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{paintLiters} L</div>
                                <p className="text-xs text-muted-foreground">
                                    {paintLiters !== (calc?.paintLiters ?? 0)
                                        ? <span className="text-amber-400">Manuell korrigiert</span>
                                        : "Berechnet (Fläche ÷ 6 m²/L × 2 Anstriche)"}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Labor Hours Card – editable */}
                <Card className="glass-card shadow-sm border-0 bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Aufwand</CardTitle>
                        <div className="flex items-center gap-1">
                            {!editingLabor && (
                                <button
                                    onClick={() => { setTempLabor(String(laborHours)); setEditingLabor(true); }}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                    title="Wert korrigieren"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                </button>
                            )}
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {editingLabor ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={tempLabor}
                                        onChange={(e) => setTempLabor(e.target.value)}
                                        autoFocus
                                        className="w-full bg-background/60 border border-primary/40 rounded px-2 py-1 text-lg font-bold focus:outline-none focus:ring-1 focus:ring-primary/60"
                                    />
                                    <span className="text-lg font-bold text-muted-foreground">Std</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={saveLabor} className="flex-1 text-xs bg-primary/80 hover:bg-primary text-white rounded px-2 py-1 transition-colors flex items-center justify-center gap-1">
                                        <Check className="w-3 h-3" /> Speichern
                                    </button>
                                    <button onClick={cancelLabor} className="flex-1 text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors flex items-center justify-center gap-1">
                                        <X className="w-3 h-3" /> Abbrechen
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{laborHours.toFixed(1)} Std</div>
                                <p className="text-xs text-muted-foreground">
                                    {laborHours !== (calc?.laborHours ?? 0)
                                        ? <span className="text-amber-400">Manuell korrigiert</span>
                                        : "Berechnet (Fläche × 0.5 Std/m²)"}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Condition & Prep Steps */}
            {details && (
                <Card className="glass-card shadow-sm border-0 bg-secondary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Zustand & Vorbereitung</CardTitle>
                        <Check className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-sm font-semibold">{details.condition}</div>
                        {details.steps && (
                            <ul className="text-sm text-muted-foreground space-y-1">
                                {details.steps.map((step, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="w-3 h-3 text-green-400" />
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
