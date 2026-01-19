"use client";

import React, { useEffect, useState } from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Copy, Key, Plus, Trash2, Terminal, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ApiKey {
    id: string;
    key_label: string;
    api_key: string; // Ideally masked in real prod, but showing here for UX as per plan
    created_at: string;
    last_used_at: string | null;
}

export const DeveloperSection = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [showNewKeyInput, setShowNewKeyInput] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        setBaseUrl(window.location.origin);
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/keys');
            if (res.ok) {
                const data = await res.json();
                setKeys(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateKey = async () => {
        if (!newLabel.trim()) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: newLabel })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                return;
            }

            await fetchKeys();
            setShowNewKeyInput(false);
            setNewLabel("");
        } catch (error) {
            alert("Failed to generate key");
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteKey = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone and will break any apps using this key.")) return;
        try {
            await fetch('/api/keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchKeys();
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied directly to clipboard!");
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">

            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Terminal className="w-8 h-8 text-cyan-400" />
                        Developer API
                    </h2>
                    <p className="text-white/50 mt-1">Integrate MedVision directly into your own applications.</p>
                </div>

                {!showNewKeyInput && keys.length < 5 && (
                    <Button onClick={() => setShowNewKeyInput(true)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Generate New Key
                    </Button>
                )}
            </div>

            {/* API Keys List */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {showNewKeyInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/5 border border-cyan-500/30 rounded-xl p-4 flex gap-4 items-center"
                        >
                            <Key className="w-5 h-5 text-cyan-400" />
                            <input
                                type="text"
                                placeholder="Key Label (e.g. Production App)"
                                className="bg-transparent border-none text-white placeholder-white/30 focus:outline-none flex-1"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setShowNewKeyInput(false)} size="sm">Cancel</Button>
                                <Button onClick={generateKey} disabled={isGenerating} size="sm" className="bg-cyan-500 text-black">
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>
                ) : keys.length === 0 && !showNewKeyInput ? (
                    <div className="text-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <Key className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-white font-medium text-lg">No API Keys Found</h3>
                        <p className="text-white/40 text-sm mt-1">Generate a key to start building.</p>
                    </div>
                ) : (
                    keys.map((key) => (
                        <GlassCard key={key.id} className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 border-white/5">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-white font-bold text-lg">{key.key_label}</h3>
                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/60">
                                        Created: {new Date(key.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/10 group relative overflow-hidden">
                                    <code className="text-cyan-400 font-mono text-sm flex-1 truncate">{key.api_key}</code>
                                    <div className="absolute inset-0 bg-transparent group-hover:bg-white/5 transition-colors cursor-pointer" onClick={() => copyToClipboard(key.api_key)} />
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(key.api_key)} className="z-10 hover:text-cyan-400">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {key.last_used_at ? (
                                    <div className="text-right">
                                        <p className="text-xs text-white/40">Last used</p>
                                        <p className="text-xs text-green-400 font-mono">{new Date(key.last_used_at).toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <span className="text-xs text-white/30 italic">Never used</span>
                                )}
                                <Button onClick={() => deleteKey(key.id)} variant="ghost" className="text-white/40 hover:text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Quick Start Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-black/30 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-purple-400" /> Base Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Base URL</label>
                            <div className="mt-2 bg-black/50 p-3 rounded-lg border border-white/10 flex items-center justify-between">
                                <code className="text-white/80 font-mono text-sm">{baseUrl}/api/v1/analyze</code>
                                <Copy className="w-4 h-4 text-white/30 cursor-pointer hover:text-white" onClick={() => copyToClipboard(`${baseUrl}/api/v1/analyze`)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" /> Usage Example (cURL)
                    </h3>
                    <div className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto">
                        <pre className="text-xs font-mono text-white/70 leading-relaxed">
                            {`curl -X POST ${baseUrl}/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"text": "Tylenol 500mg"}'`}
                        </pre>
                    </div>
                </div>
            </div>

        </div>
    );
};
