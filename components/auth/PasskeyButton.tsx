'use client'

import React, { useEffect, useState } from 'react'
import { detectBiometricCapability, registerPasskey, authenticateWithPasskey, DeviceBiometricInfo } from '../../lib/auth/passkeys'
import { ShieldCheck, Fingerprint, ScanFace, Laptop, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface PasskeyButtonProps {
  mode?: 'register' | 'login'
  onSuccess?: () => void
  className?: string
}

export const PasskeyButton: React.FC<PasskeyButtonProps> = ({
  mode = 'register',
  onSuccess,
  className = '',
}) => {
  const [capability, setCapability] = useState<DeviceBiometricInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    detectBiometricCapability().then(setCapability)
  }, [])

  const handleAction = async () => {
    setLoading(true)
    setStatusMessage(null)

    try {
      const res = mode === 'register' ? await registerPasskey() : await authenticateWithPasskey()
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message })
        if (onSuccess) onSuccess()
      } else {
        setStatusMessage({ type: 'error', text: res.message })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء الاتصال بالبصمة' })
    } finally {
      setLoading(false)
    }
  }

  if (!capability || !capability.isSupported) {
    return null
  }

  const renderIcon = () => {
    if (capability.biometricType === 'face_id') {
      return <ScanFace className="w-5 h-5 text-sky-400 animate-pulse" />
    }
    if (capability.biometricType === 'touch_id' || capability.biometricType === 'android_biometric') {
      return <Fingerprint className="w-5 h-5 text-emerald-400 animate-pulse" />
    }
    return <ShieldCheck className="w-5 h-5 text-indigo-400" />
  }

  const getLabel = () => {
    if (mode === 'register') {
      switch (capability.biometricType) {
        case 'face_id':
          return 'تفعيل Face ID على الآيفون'
        case 'touch_id':
          return 'تفعيل Touch ID على الماك'
        case 'android_biometric':
          return 'تفعيل البصمة الذكية للأندرويد'
        case 'windows_hello':
          return 'تفعيل Windows Hello'
        default:
          return 'تفعيل البصمة الذكية / Passkey'
      }
    } else {
      return capability.biometricType === 'face_id' ? 'تسجيل الدخول بـ Face ID' : 'تسجيل الدخول بالبصمة الذكية'
    }
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAction}
        disabled={loading}
        className={`w-full relative group overflow-hidden rounded-xl p-[1px] focus:outline-none transition-all duration-300 ${className}`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity blur-[1px]" />
        <div className="relative w-full bg-slate-950/90 hover:bg-slate-900/90 text-white font-medium py-3 px-4 rounded-[11px] flex items-center justify-center gap-3 backdrop-blur-xl transition-all">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> : renderIcon()}
          <span className="text-sm tracking-wide">{getLabel()}</span>
        </div>
      </button>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 text-xs p-3 rounded-lg border backdrop-blur-md transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  )
}
