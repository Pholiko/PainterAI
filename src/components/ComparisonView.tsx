"use client";

import React from 'react';
import ReactCompareImage from 'react-compare-image';
import { motion } from 'framer-motion';

// Polyfill for Desktop Safari where TouchEvent is undefined causing react-compare-image to crash
if (typeof window !== 'undefined' && typeof window.TouchEvent === 'undefined') {
    (window as any).TouchEvent = class TouchEvent extends Event {};
}

interface ComparisonViewProps {
    beforeImage: string;
    afterImage: string;
    className?: string;
}

export function ComparisonView({ beforeImage, afterImage, className }: ComparisonViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`relative w-full overflow-hidden rounded-3xl border border-border/50 shadow-2xl ${className}`}
        >
            <div className="aspect-video w-full h-full">
                <ReactCompareImage
                    leftImage={beforeImage}
                    rightImage={afterImage}
                    sliderLineColor="var(--primary)"
                    sliderLineWidth={2}
                    handleSize={40}
                    handle={
                        <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg border-4 border-background">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m9 18 6-6-6-6" />
                                <path d="M15 18" />
                            </svg>
                        </div>
                    }
                />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                Vorher
            </div>
            <div className="absolute bottom-4 right-4 bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                KI-Vorschau (folgt)
            </div>
        </motion.div>
    );
}
