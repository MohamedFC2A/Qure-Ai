"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { getBaseUrl } from "@/lib/config";
import { Copy, Terminal, FileJson, CheckCircle, Code, Cpu } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function DocsPage() {
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        setBaseUrl(getBaseUrl());
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied!");
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Documentation Hub</h1>
                <p className="text-white/50 text-xl max-w-2xl mx-auto">
                    Complete integration guide for MedVision AI. Learn how to connect your apps with our military-grade analysis engine.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation (Sticky on Desktop) */}
                <div className="lg:col-span-1 hidden lg:block">
                    <div className="sticky top-28 space-y-2 border-l border-white/10 pl-6">
                        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Guides</h3>
                        <a href="#getting-started" className="block text-white/60 hover:text-cyan-400 transition-colors">Getting Started</a>
                        <a href="#api-reference" className="block text-white/60 hover:text-cyan-400 transition-colors">API Reference</a>
                        <a href="#ocr-integration" className="block text-white/60 hover:text-cyan-400 transition-colors">OCR Integration</a>
                        <a href="#code-examples" className="block text-white/60 hover:text-cyan-400 transition-colors">Code Examples</a>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-16">

                    {/* Getting Started */}
                    <section id="getting-started" className="space-y-6">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-400" /> Getting Started
                        </h2>
                        <GlassCard className="p-8 border-white/10">
                            <p className="text-white/70 mb-4 leading-relaxed">
                                To start using the MedVision API, you need an <strong>API Key</strong>.
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-white/70 ml-2">
                                <li>Navigate to the <a href="/dashboard" className="text-cyan-400 underline">Dashboard</a>.</li>
                                <li>Click on <strong>Generate New Key</strong>.</li>
                                <li>Copy your key immediately (starts with <code>mv_sk_</code>).</li>
                            </ol>
                        </GlassCard>
                    </section>

                    {/* API Reference */}
                    <section id="api-reference" className="space-y-6">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Terminal className="w-8 h-8 text-purple-400" /> API Reference
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md font-mono font-bold">POST</span>
                                <code className="text-white bg-black/40 px-3 py-1 rounded-md border border-white/10">{baseUrl}/api/v1/analyze</code>
                            </div>

                            <GlassCard className="p-6 border-white/10 bg-black/40">
                                <h4 className="text-white font-bold mb-2">Headers</h4>
                                <ul className="text-sm text-white/60 space-y-1 font-mono">
                                    <li>Content-Type: application/json</li>
                                    <li>x-api-key: YOUR_API_KEY</li>
                                </ul>
                            </GlassCard>

                            <GlassCard className="p-6 border-white/10 bg-black/40">
                                <h4 className="text-white font-bold mb-2">Body</h4>
                                <pre className="text-xs text-white/60 bg-black/50 p-4 rounded-lg overflow-x-auto">
                                    {`{
  "text": "Tylenol 500mg taken twice daily"
}`}
                                </pre>
                            </GlassCard>
                        </div>
                    </section>

                    {/* OCR Integration */}
                    <section id="ocr-integration" className="space-y-6">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Cpu className="w-8 h-8 text-blue-400" /> OCR Integration (Tesseract.js)
                        </h2>
                        <p className="text-white/60">
                            The API expects <strong>text</strong>. To scan images (like pill bottles), you must first extract text using an OCR library like Tesseract.js.
                        </p>
                        <GlassCard className="p-0 border-white/10 overflow-hidden">
                            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                                <span className="text-sm text-white/50 font-mono">client-side-ocr.js</span>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`import Tesseract from 'tesseract.js';\n\nasync function scanAndAnalyze(imageFile, apiKey) {\n    // 1. Extract Text from Image\n    const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');\n    console.log("Extracted Text:", text);\n\n    // 2. Send Text to MedVision API\n    const response = await fetch('${baseUrl}/api/v1/analyze', {\n        method: 'POST',\n        headers: {\n            'Content-Type': 'application/json',\n            'x-api-key': apiKey\n        },\n        body: JSON.stringify({ text })\n    });\n\n    const result = await response.json();\n    return result;\n}`)}>
                                    <Copy className="w-4 h-4 text-white/50" />
                                </Button>
                            </div>
                            <div className="p-6 bg-black/50 overflow-x-auto">
                                <pre className="text-sm text-blue-300 font-mono">
                                    {`import Tesseract from 'tesseract.js';

async function scanAndAnalyze(imageFile, apiKey) {
    // 1. Extract Text from Image
    const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');
    console.log("Extracted Text:", text);

    // 2. Send Text to MedVision API
    const response = await fetch('${baseUrl}/api/v1/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ text })
    });

    const result = await response.json();
    return result;
}`}
                                </pre>
                            </div>
                        </GlassCard>
                    </section>

                    {/* Code Examples */}
                    <section id="code-examples" className="space-y-6">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Code className="w-8 h-8 text-yellow-400" /> Code Examples
                        </h2>

                        <div className="grid gap-6">
                            {/* cURL */}
                            <div>
                                <h4 className="text-white font-bold mb-2">cURL</h4>
                                <div className="bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-sm text-white/70 overflow-x-auto">
                                    {`curl -X POST ${baseUrl}/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: mv_sk_..." \\
  -d '{"text": "Aspirin 81mg"}'`}
                                </div>
                            </div>

                            {/* Node.js */}
                            <div>
                                <h4 className="text-white font-bold mb-2">Node.js (Fetch)</h4>
                                <div className="bg-black/50 p-4 rounded-lg border border-white/10 font-mono text-sm text-white/70 overflow-x-auto">
                                    {`const response = await fetch("${baseUrl}/api/v1/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "mv_sk_..."
  },
  body: JSON.stringify({ text: "Panadol Extra" })
});
const data = await response.json();
console.log(data);`}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
