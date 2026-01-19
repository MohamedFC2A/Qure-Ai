"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Camera, Loader2, X, ScanLine, CheckCircle, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MedicalResultCard } from "./MedicalResultCard";
import { createWorker } from "tesseract.js";
import { GlassCard } from "@/components/ui/GlassCard";

export const ScannerInterface = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Deepseek Phase
    const [statusText, setStatusText] = useState("");
    const [progress, setProgress] = useState(0);
    const [scanResult, setScanResult] = useState<any>(null); // Preliminary Result for confirmation
    const [finalResult, setFinalResult] = useState<any>(null); // Confirmed result

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState(12);

    // Reset everything
    const resetScan = () => {
        setFile(null);
        setPreview(null);
        setScanResult(null);
        setFinalResult(null);
        setIsScanning(false);
        setIsAnalyzing(false);
        setProgress(0);
        setTimeLeft(12);
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
            setPreview(URL.createObjectURL(acceptedFiles[0]));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
        maxFiles: 1,
    });

    // 1. Image Preprocessing (Canvas Binarization)
    const preprocessImage = (imageFile: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    // Simple contrast boost could be added here if needed
                }
                resolve(canvas.toDataURL('image/jpeg', 1.0)); // Best quality
            };
        });
    };

    // 2. Automated Flow: OCR -> AI Analysis -> Confirmation
    const startAutomatedScan = async () => {
        if (!file) return;
        setIsScanning(true);
        setStatusText("Preparing Image...");
        setProgress(0);
        setTimeLeft(12); // Start 12s timer

        // Timer Interval
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        try {
            // Step A: OCR
            const processedImage = await preprocessImage(file);
            setStatusText("Enhancing Quality...");
            setProgress(20);

            const worker = await createWorker("eng", 1, {
                logger: m => {
                    if (m.status === "recognizing text") {
                        setProgress(30 + (m.progress * 30)); // 30-60%
                    }
                }
            });

            const { data: { text } } = await worker.recognize(processedImage);
            await worker.terminate();

            if (!text || text.trim().length < 3) {
                throw new Error("No text detected. Please upload a clearer HD image.");
            }

            console.log("OCR Extracted:", text);

            // Step B: Deepseek Analysis
            setIsScanning(false);
            setIsAnalyzing(true);
            setStatusText("DeepSeek Analysis...");
            setProgress(70);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setProgress(100);
            setScanResult(data); // Show Confirmation Modal

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Scanning failed. Please use an HD image.");
            resetScan();
        } finally {
            clearInterval(timer);
            setIsScanning(false);
            setIsAnalyzing(false);
        }
    };

    // 3. User Confirms the AI Result
    const confirmResult = () => {
        setFinalResult(scanResult);
        setScanResult(null);
    };

    // PROGRESS LIST COMPONENT (The "Todo List")
    const ProgressList = () => {
        const steps = [
            { id: 1, label: "Image Enhancement", done: progress >= 20, current: isScanning && progress < 30 },
            { id: 2, label: "Optical Text Recognition", done: progress >= 60, current: isScanning && progress >= 30 },
            { id: 3, label: "DeepSeek Medical Analysis", done: progress >= 90, current: isAnalyzing },
            { id: 4, label: "Final Validation", done: progress === 100, current: false },
        ];

        return (
            <div className="w-full mr-12 bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                        System Processing
                    </h3>
                    <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/30 text-cyan-400 font-mono text-sm">
                        {timeLeft}s remaining
                    </div>
                </div>

                <div className="space-y-4">
                    {steps.map((step, idx) => (
                        <div key={step.id} className={cn("flex items-center gap-3 transition-all duration-300", step.current || step.done ? "opacity-100" : "opacity-30")}>
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
                                step.done ? "bg-green-500 border-green-500" : step.current ? "border-cyan-400 animate-pulse" : "border-white/20"
                            )}>
                                {step.done && <CheckCircle className="w-4 h-4 text-black" />}
                                {step.current && <div className="w-2 h-2 bg-cyan-400 rounded-full" />}
                            </div>
                            <span className={cn(
                                "text-sm",
                                step.done ? "text-green-400 font-medium" : step.current ? "text-white font-bold" : "text-white"
                            )}>
                                {step.label}
                            </span>
                            {step.current && (
                                <span className="ml-auto text-xs text-white/50 animate-pulse">Running...</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // View: Final Result Card
    if (finalResult) {
        return (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="w-full flex justify-between items-center mb-6 max-w-4xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="text-green-400" /> Analysis Complete
                    </h2>
                    <Button onClick={resetScan} variant="outline" size="sm">New Scan</Button>
                </div>
                <MedicalResultCard data={finalResult} />
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative p-4">
            <AnimatePresence mode="wait">

                {/* STATE 1: UPLOAD */}
                {!file && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-lg"
                    >
                        <div
                            {...getRootProps()}
                            className={cn(
                                "relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group overflow-hidden",
                                isDragActive
                                    ? "border-cyan-500 bg-cyan-500/10"
                                    : "border-white/20 hover:border-cyan-500/50 hover:bg-white/5"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] w-full animate-scan opacity-0 group-hover:opacity-100 pointer-events-none" />

                            <input {...getInputProps()} />
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-cyan-500/50 shadow-xl">
                                <ScanLine className="w-10 h-10 text-white/60 group-hover:text-cyan-400" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2 relative z-10">
                                Upload Medication Image
                            </h3>
                            <p className="text-white/50 text-sm max-w-xs relative z-10 flex items-center justify-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-yellow-500" /> Use HD Image for best results
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* STATE 2: PREVIEW & PROGRESS */}
                {file && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full flex flex-col md:flex-row items-start max-w-5xl gap-8"
                    >
                        {/* LEFT: Image Preview */}
                        <div className="w-full md:w-1/2 relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 text-center">
                            <img src={preview!} alt="Preview" className={cn("w-full h-64 md:h-96 object-contain bg-black/50 transition-all duration-700", (isScanning || isAnalyzing) && "opacity-50 blur-sm")} />

                            {/* Start Button */}
                            {!isScanning && !isAnalyzing && !scanResult && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                                    <Button onClick={startAutomatedScan} size="lg" className="rounded-full h-16 px-8 text-lg shadow-2xl shadow-cyan-500/20 hover:scale-105 transition-transform">
                                        <ScanLine className="w-5 h-5 mr-2" /> Start Analysis
                                    </Button>
                                    <button onClick={resetScan} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-red-500/20 text-white"><X className="w-5 h-5" /></button>
                                </div>
                            )}

                            {/* CONFIRMATION OVERLAY */}
                            {scanResult && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
                                    <GlassCard className="w-full max-w-sm p-6 border-cyan-500/50">
                                        <div className="flex flex-col items-center text-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                                <CheckCircle className="w-8 h-8 text-cyan-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-white/60 text-xs uppercase font-bold">DeepSeek Identification</h3>
                                                <h2 className="text-2xl font-bold text-white mb-2">{scanResult.drugName}</h2>
                                                <p className="text-white/50 text-sm">Correct medication?</p>
                                            </div>
                                            <div className="flex gap-2 w-full mt-2">
                                                <Button variant="outline" onClick={resetScan} className="flex-1 text-xs">Retake</Button>
                                                <Button onClick={confirmResult} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold">Confirm</Button>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Progress List (Only visible when scanning) */}
                        <div className="w-full md:w-1/2 flex items-center">
                            {(isScanning || isAnalyzing || scanResult) ? (
                                <ProgressList />
                            ) : (
                                <div className="hidden md:flex flex-col justify-center h-full text-white/30 p-8">
                                    <h3 className="text-xl font-bold text-white/50 mb-2">Ready to Initialize</h3>
                                    <p>Our advanced AI pipeline is standing by to analyze your medication. Ensure the text is readable.</p>
                                    <div className="mt-8 space-y-2">
                                        <div className="h-2 w-full bg-white/5 rounded-full" />
                                        <div className="h-2 w-2/3 bg-white/5 rounded-full" />
                                        <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                                    </div>
                                </div>
                            )}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
