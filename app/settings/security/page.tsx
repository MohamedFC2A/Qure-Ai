'use client'

import React, { useEffect, useState } from 'react'
import { PasskeyButton } from '../../../components/auth/PasskeyButton'
import { createClient } from '../../../lib/supabase/client'
import { ShieldCheck, Lock, Database, Sparkles, KeyRound, Smartphone, Radio, UserCheck, AlertCircle } from 'lucide-react'

export default function SecuritySettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [passkeys, setPasskeys] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadSecurityData() {
      try {
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        if (currentUser) {
          const { data } = await supabase
            .from('user_passkeys')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })

          if (data) setPasskeys(data)
        }
      } catch (err) {
        console.error('Error loading security credentials:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSecurityData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 dir-rtl font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
              أمان وحماية الحساب الطبي العائلي (World-Class Security)
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              إدارة البصمة الذكية (Face ID)، عزل بيانات العائلة RLS، والتشفير الكامل للروشتات والتحاليل.
            </p>
          </div>
        </div>

        {/* 1. Biometrics & Passkeys (Face ID / Touch ID) Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">المصادقة بالبصمة الذكية (Face ID / Passkeys)</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  سجل دخولك فوراً ببصمة الوجه في الآيفون أو بصمة الأصبع بالأندرويد دون الحاجة لكلمة سر.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <PasskeyButton
              mode="register"
              onSuccess={() => {
                const supabase = createClient()
                if (user) {
                  supabase
                    .from('user_passkeys')
                    .select('*')
                    .eq('user_id', user.id)
                    .then(({ data }: { data: any }) => data && setPasskeys(data))
                }
              }}
            />
          </div>

          {/* Registered Devices List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-slate-300">الأجهزة والبصمات المسجلة:</h3>
            {passkeys.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 border border-dashed border-slate-800 rounded-xl text-center">
                لم تقم بتسجيل أي بصمة ذكية بعد. اضغط على الزر أعلاه لتفعيل Face ID.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {passkeys.map((pk) => (
                  <div
                    key={pk.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="font-semibold text-slate-200">{pk.friendly_name}</div>
                        <div className="text-[10px] text-slate-500">
                          أخر استخدام: {new Date(pk.last_used_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-medium">
                      نشط وآمن
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Enterprise Security Architecture Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RLS Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Row Level Security (RLS)</h3>
                <span className="text-[11px] text-emerald-400 font-medium">مفعل 100% - عزل عائلي كامل</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              كل فرد من أفراد عائلتك يمتلك سياقاً منفصلاً تماماً لحمايته من أي وصول غير مصرح به.
            </p>
          </div>

          {/* Private Storage Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Private Storage & Signed URLs</h3>
                <span className="text-[11px] text-indigo-400 font-medium">تشفير روابط الروشتات مؤقتاً</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              الصور والأشعة غير متاحة للعامة نهائياً وتم إنشاء روابط مؤقتة ذاتية الانتهاء فقط.
            </p>
          </div>

          {/* pgvector Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-950/60 border border-purple-500/30 rounded-xl text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">pgvector Semantic RAG Search</h3>
                <span className="text-[11px] text-purple-400 font-medium">مفعل ومجهزة للذكاء الاصطناعي</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يتم تحويل الروشتات إلى متجه بيانات رياضية لإجراء بحث ذكي فائق السرعة في الذاكرة الطبية.
            </p>
          </div>

          {/* Realtime Status */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-950/60 border border-amber-500/30 rounded-xl text-amber-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Realtime Status Streaming</h3>
                <span className="text-[11px] text-amber-400 font-medium">بث فوري مباشر لمراحل الـ OCR</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يتم تحديث شاشة التحليل لحظياً فور معالجة الذكاء الاصطناعي لصور الروشتة والأشعة.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
