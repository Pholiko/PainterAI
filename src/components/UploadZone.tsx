"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    isAnalyzing?: boolean;
}

export function UploadZone({ onFileSelect, isAnalyzing }: UploadZoneProps) {
    const [dragActive, setDragActive] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        disabled: isAnalyzing
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative group cursor-pointer w-full max-w-2xl mx-auto rounded-3xl border-2 border-dashed transition-all duration-500 ease-out overflow-hidden p-12 text-center",
                isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/40 hover:border-primary/50 hover:bg-card/30",
                isAnalyzing && "opacity-50 pointer-events-none"
            )}
        >
            <input {...getInputProps()} />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className={cn(
                        "absolute -inset-4 bg-primary/20 rounded-full blur-xl transition-all duration-500",
                        isDragActive ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
                    )} />
                    <div className="bg-card p-4 rounded-2xl shadow-xl border border-border/50">
                        <UploadCloud className={cn("w-10 h-10 text-primary transition-all duration-300", isDragActive && "scale-110")} />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                        Upload your wall photo
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        Drag and drop simply, or click to browse. We support JPG, PNG & WebP.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>High Quality analysis</span>
                </div>
            </div>
        </div>
    );
}
