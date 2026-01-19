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
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto space-y-16">

            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-blue-200">
                    Developer Hub
                </h1>
                <p className="text-xl text-white/50 max-w-3xl mx-auto">
                    Complete integration guide for the MedVision Pharmaceutical Analysis Engine.
                    Connect your applications with military-grade OCR and drug data.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 hidden lg:block">
                    <div className="sticky top-28 space-y-1 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Documentation</h3>

                        <a href="#authentication" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all group">
                            <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" /> Authentication
                        </a>
                        <a href="#quick-start" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all group">
                            <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" /> Quick Start
                        </a>
                        <a href="#ocr-integration" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all group">
                            <Cpu className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" /> OCR Integration
                        </a>
                        <a href="#input-mode" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all group">
                            <Database className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" /> Input Mode
                        </a>
                        <a href="#cli-tools" className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all group">
                            <Terminal className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" /> CLI Tools
                        </a>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9 space-y-16">

                    {/* Authentication */}
                    <section id="authentication" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-cyan-500/20 rounded-xl">
                                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Authentication</h2>
                        </div>
                        <GlassCard className="p-8 border-white/10 space-y-6">
                            <p className="text-white/70 leading-relaxed">
                                All API requests require a valid API Key to be passed in the header.
                                Keys are strictly rate-limited and monitored for abuse.
                            </p>

                            <div className="bg-black/30 rounded-xl border border-white/5 p-4 flex items-center justify-between">
                                <code className="text-cyan-300 font-mono">x-api-key: mv_sk_...</code>
                                <span className="text-xs text-white/40 uppercase tracking-wider font-bold">Header</span>
                            </div>

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <p className="text-yellow-200 text-sm">
                                    <span className="font-bold">Note:</span> Never expose your API key in client-side code unless you are using a secure proxy.
                                </p>
                            </div>
                        </GlassCard>
                    </section>

                    {/* Integration Logic */}
                    <section id="integration-logic" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <Code className="w-8 h-8 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">How it Works</h2>
                        </div>
                        <GlassCard className="p-8 border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-pink-400" /> 1. OCR Mode
                                    </h3>
                                    <p className="text-white/60 text-sm">
                                        Use this when you have an IMAGE (e.g., pill bottle photo).
                                        You must first extract text using an OCR engine like
                                        <code className="bg-white/10 px-1 rounded mx-1 text-white">tesseract.js</code>
                                        before sending the raw text to our API.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Database className="w-5 h-5 text-green-400" /> 2. Input Mode
                                    </h3>
                                    <p className="text-white/60 text-sm">
                                        Use this when you already have the drug name (e.g., user typed "Panadol").
                                        Simply send the text directly.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </section>


                    {/* OCR Integration Guide */}
                    <section id="ocr-integration" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-pink-500/20 rounded-xl">
                                <Cpu className="w-8 h-8 text-pink-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">OCR Integration</h2>
                                <p className="text-white/40 mt-1">For Image-based Analysis</p>
                            </div>
                        </div>

                        <GlassCard className="p-0 border-white/10 overflow-hidden">
                            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                <span className="text-sm text-white/50 font-mono">ocr_client.js</span>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`import Tesseract from 'tesseract.js';

// 1. Initialize Worker (Better Performance)
const worker = await Tesseract.createWorker('eng');

async function processImage(imageFile) {
    console.log("Scanning image...");
    
    // 2. Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    console.log("Raw Text Extracted:", text);

    // 3. Send to MedVision API
    const response = await fetch('${baseUrl}/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'YOUR_API_KEY'
        },
        body: JSON.stringify({ 
            text: text,
            mode: 'ocr' // Optional hint
        })
    });

    return await response.json();
}`)}>
                                    <Copy className="w-4 h-4 text-white/50" />
                                </Button>
                            </div>
                            <div className="p-6 bg-black/50 overflow-x-auto">
                                <pre className="text-sm text-pink-300 font-mono leading-relaxed">
                                    {`import Tesseract from 'tesseract.js';

// 1. Initialize Worker (Better Performance)
const worker = await Tesseract.createWorker('eng');

async function processImage(imageFile) {
    console.log("Scanning image...");
    
    // 2. Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    console.log("Raw Text Extracted:", text);

    // 3. Send to MedVision API
    const response = await fetch('${baseUrl}/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'YOUR_API_KEY'
        },
        body: JSON.stringify({ 
            text: text,
            mode: 'ocr' // Optional hint
        })
    });

    return await response.json();
}`}
                                </pre>
                            </div>
                        </GlassCard>
                    </section>


                    {/* CLI Tools */}
                    <section id="cli-tools" className="scroll-mt-32">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <Terminal className="w-8 h-8 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">CLI Testing Tools</h2>
                                <p className="text-white/40 mt-1">Copy & Paste scripts to test your integration</p>
                            </div>
                        </div>

                        <div className="grid gap-8">
                            {/* CURL */}
                            <GlassCard className="p-0 border-white/10 overflow-hidden">
                                <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                    <span className="text-sm text-white/50 font-mono">Terminal (cURL)</span>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: mv_sk_YOUR_KEY" \\
  -d '{"text": "Ibuprofen 200mg"}'`)}>
                                        <Copy className="w-4 h-4 text-white/50" />
                                    </Button>
                                </div>
                                <div className="p-6 bg-black/90">
                                    <code className="text-green-400 font-mono text-sm block">
                                        curl -X POST {baseUrl}/api/analyze \<br />
                                        &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                                        &nbsp;&nbsp;-H "x-api-key: mv_sk_YOUR_KEY" \<br />
                                        &nbsp;&nbsp;-d '{"{"} "text": "Ibuprofen 200mg" {"}"}'
                                    </code>
                                </div>
                            </GlassCard>

                            {/* Node Script */}
                            <GlassCard className="p-0 border-white/10 overflow-hidden">
                                <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                    <span className="text-sm text-white/50 font-mono">test-api.js</span>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`const axios = require('axios');

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

testDrug("Panadol Extra");`)}>
                                        <Copy className="w-4 h-4 text-white/50" />
                                    </Button>
                                </div>
                                <div className="p-6 bg-black/90 overflow-x-auto">
                                    <pre className="text-yellow-300 font-mono text-sm leading-relaxed">
                                        {`const axios = require('axios');

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

testDrug("Panadol Extra");`}
                                    </pre>
                                </div>
                            </GlassCard>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
