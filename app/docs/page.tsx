"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { getBaseUrl } from "@/lib/config";
import { Copy, Terminal, Database, Code, Cpu, ShieldCheck, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function DocsPage() {
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        setBaseUrl(getBaseUrl());
    }, []);

    const copyToClipboard = (text: string) => {
        if (typeof navigator !== "undefined") {
            navigator.clipboard.writeText(text);
            alert("Copied to clipboard!");
        }
    };

    const ocrSnippet = `import Tesseract from 'tesseract.js';

// 1. Initialize Worker
const worker = await Tesseract.createWorker('eng');

async function processImage(imageFile) {
    console.log("Scanning image...");
    
    // 2. Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    console.log("Raw Text Extracted:", text);

    // 3. Send to QureScan API
    const response = await fetch('${baseUrl}/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'YOUR_API_KEY'
        },
        body: JSON.stringify({ 
            text: text,
            mode: 'ocr'
        })
    });

    return await response.json();
}`;

    const curlSnippet = `curl -X POST ${baseUrl}/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: mv_sk_YOUR_KEY" \\
  -d '{"text": "Ibuprofen 200mg"}'`;

    const nodeSnippet = `const axios = require('axios');

const API_KEY = "mv_sk_YOUR_KEY";
const URL = "${baseUrl}/api/analyze";

async function testDrug(drugName) {
    console.log(\`Testing: \${drugName}...\`);
    try {
        const { data } = await axios.post(URL, { text: drugName }, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log("✅ Success:", data);
    } catch (e) {
        console.error("❌ Error:", e.response ? e.response.data : e.message);
    }
}

testDrug("Panadol Extra");`;

    return (
        <main className="min-h-screen pt-24 sm:pt-28 pb-24 md:pb-12 px-3 sm:px-6">
            <div className="clinical-page space-y-8 sm:space-y-12">

                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="clinical-eyebrow mx-auto">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>API Documentation</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Developer Hub
                    </h1>
                    <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Complete integration guide for the QureScan Pharmaceutical Analysis Engine.
                        Connect your applications with OCR and drug analysis workflows.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3 hidden lg:block">
                        <div className="sticky top-28 space-y-1 p-5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-xl">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Documentation</h3>

                            <a href="#authentication" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                                <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm">Authentication</span>
                            </a>
                            <a href="#quick-start" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                                <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm">Quick Start</span>
                            </a>
                            <a href="#ocr-integration" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                                <Cpu className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm">OCR Integration</span>
                            </a>
                            <a href="#cli-tools" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                                <Terminal className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm">CLI Tools</span>
                            </a>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-10 sm:space-y-12">

                        {/* Authentication */}
                        <section id="authentication" className="scroll-mt-32">
                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="icon-badge icon-badge-cyan w-11 h-11 rounded-xl shrink-0">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white">Authentication</h2>
                            </div>
                            <GlassCard className="p-6 sm:p-8 space-y-5" hoverEffect={false}>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    All API requests require a valid API Key to be passed in the header.
                                    Keys are strictly rate-limited and monitored for safe usage.
                                </p>

                                <div className="bg-black/40 rounded-xl border border-white/10 p-4 flex items-center justify-between">
                                    <code className="text-cyan-300 font-mono text-xs sm:text-sm">x-api-key: mv_sk_...</code>
                                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Header</span>
                                </div>

                                <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                                    <p className="text-amber-200 text-xs sm:text-sm">
                                        <span className="font-bold">Note:</span> Never expose your API key in client-side code unless you are using a secure backend proxy.
                                    </p>
                                </div>
                            </GlassCard>
                        </section>

                        {/* OCR Integration */}
                        <section id="ocr-integration" className="scroll-mt-32">
                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="icon-badge icon-badge-rose w-11 h-11 rounded-xl shrink-0">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white">OCR Integration</h2>
                                    <p className="text-slate-400 text-xs mt-0.5">For Image-based Analysis</p>
                                </div>
                            </div>

                            <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
                                <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                    <span className="text-xs sm:text-sm text-slate-400 font-mono">ocr_client.js</span>
                                    <Button variant="ghost" size="xs" onClick={() => copyToClipboard(ocrSnippet)}>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    </Button>
                                </div>
                                <div className="p-5 sm:p-6 bg-black/60 overflow-x-auto no-scrollbar">
                                    <pre className="text-xs sm:text-sm text-rose-300 font-mono leading-relaxed">
                                        {ocrSnippet}
                                    </pre>
                                </div>
                            </GlassCard>
                        </section>

                        {/* CLI Tools */}
                        <section id="cli-tools" className="scroll-mt-32">
                            <div className="flex items-center gap-3.5 mb-5">
                                <div className="icon-badge icon-badge-violet w-11 h-11 rounded-xl shrink-0">
                                    <Terminal className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white">CLI Testing Tools</h2>
                                    <p className="text-slate-400 text-xs mt-0.5">Copy & Paste scripts to test your integration</p>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {/* cURL */}
                                <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
                                    <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-slate-400 font-mono">Terminal (cURL)</span>
                                        <Button variant="ghost" size="xs" onClick={() => copyToClipboard(curlSnippet)}>
                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                    </div>
                                    <div className="p-5 sm:p-6 bg-black/60 overflow-x-auto no-scrollbar">
                                        <pre className="text-xs sm:text-sm text-emerald-300 font-mono leading-relaxed">
                                            {curlSnippet}
                                        </pre>
                                    </div>
                                </GlassCard>

                                {/* Node */}
                                <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
                                    <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-slate-400 font-mono">test-api.js</span>
                                        <Button variant="ghost" size="xs" onClick={() => copyToClipboard(nodeSnippet)}>
                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                    </div>
                                    <div className="p-5 sm:p-6 bg-black/60 overflow-x-auto no-scrollbar">
                                        <pre className="text-xs sm:text-sm text-amber-300 font-mono leading-relaxed">
                                            {nodeSnippet}
                                        </pre>
                                    </div>
                                </GlassCard>
                            </div>
                        </section>

                    </div>
                </div>

            </div>
        </main>
    );
}
