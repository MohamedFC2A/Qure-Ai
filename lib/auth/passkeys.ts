import { createClient } from '../supabase/client'

export interface DeviceBiometricInfo {
  isSupported: boolean
  biometricType: 'face_id' | 'touch_id' | 'windows_hello' | 'android_biometric' | 'generic'
  authenticatorAvailable: boolean
}

/**
 * Detects device hardware biometric capabilities (iPhone Face ID, Android Biometrics, Touch ID, Windows Hello)
 */
export async function detectBiometricCapability(): Promise<DeviceBiometricInfo> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { isSupported: false, biometricType: 'generic', authenticatorAvailable: false }
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    const ua = navigator.userAgent.toLowerCase()

    let biometricType: DeviceBiometricInfo['biometricType'] = 'generic'
    if (/iphone|ipad|ipod/.test(ua)) {
      biometricType = 'face_id' // iOS Face ID / Touch ID
    } else if (/macintosh|mac os x/.test(ua)) {
      biometricType = 'touch_id' // macOS Touch ID
    } else if (/android/.test(ua)) {
      biometricType = 'android_biometric' // Android Fingerprint / Face Unlock
    } else if (/windows/.test(ua)) {
      biometricType = 'windows_hello' // Windows Hello
    }

    return {
      isSupported: true,
      biometricType,
      authenticatorAvailable: available,
    }
  } catch (err) {
    return { isSupported: false, biometricType: 'generic', authenticatorAvailable: false }
  }
}

/**
 * Registers a new authentic WebAuthn Passkey (Face ID / Touch ID / Biometric) for the current user
 */
export async function registerPasskey(friendlyName?: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
    const { data: authData, error: userError } = await supabase.auth.getUser()
    const user = authData?.user ?? null

    if (userError || !user) {
      return { success: false, message: 'يجب تسجيل الدخول أولاً لتفعيل البصمة الذكية.' }
    }

    const capability = await detectBiometricCapability()
    if (!capability.isSupported || !capability.authenticatorAvailable) {
      return { success: false, message: 'البصمة الذكية غير مدعومة على هذا الجهاز أو متصفح الاستعراض الحالي.' }
    }

    // Challenge & Credential Creation Options according to WebAuthn standard
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const userIdBytes = new TextEncoder().encode(user.id)

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Qure Scan Medical AI',
        id: window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: user.email || user.id,
        displayName: user.user_metadata?.full_name || user.email || 'Qure Scan User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in Face ID / Touch ID / Fingerprint
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    }

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null

    if (!credential) {
      return { success: false, message: 'تم إلغاء عملية تفعيل البصمة.' }
    }

    const credentialId = credential.id
    const rawIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))

    // Save Passkey metadata in Supabase
    const { error: dbError } = await supabase.from('user_passkeys').insert({
      user_id: user.id,
      credential_id: credentialId,
      public_key: rawIdBase64,
      device_type: capability.biometricType,
      friendly_name: friendlyName || `${capability.biometricType.toUpperCase()} Passkey`,
    })

    if (dbError) {
      console.error('[Passkey DB Error]:', dbError)
      return { success: false, message: `تعذر حفظ البصمة: ${dbError.message}` }
    }

    return { success: true, message: 'تم تفعيل البصمة الذكية (Face ID / Touch ID) بنجاح!' }
  } catch (err: any) {
    console.error('[Passkey Registration Exception]:', err)
    if (err.name === 'NotAllowedError') {
      return { success: false, message: 'تم رفض طلب استخدام البصمة من قبل المستخدم.' }
    }
    return { success: false, message: err.message || 'حدث خطأ غير متوقع أثناء إعداد البصمة.' }
  }
}

/**
 * Authenticates the user seamlessly using authentic WebAuthn / Face ID / Passkeys
 */
export async function authenticateWithPasskey(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()
    const capability = await detectBiometricCapability()

    if (!capability.isSupported) {
      return { success: false, message: 'البصمة الذكية غير مدعومة في هذا الجهاز.' }
    }

    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const publicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: 'required',
    }

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyRequestOptions,
    })) as PublicKeyCredential | null

    if (!assertion) {
      return { success: false, message: 'فشلت عملية التحقق من البصمة.' }
    }

    // Verify credential ID exists in Supabase user_passkeys
    const credentialId = assertion.id
    const { data: passkey, error } = await supabase
      .from('user_passkeys')
      .select('user_id, friendly_name')
      .eq('credential_id', credentialId)
      .single()

    if (error || !passkey) {
      return { success: false, message: 'البصمة غير مسجلة في هذا الحساب. يرجى تفعيلها أولاً من الإعدادات.' }
    }

    // Update last_used_at timestamp
    await supabase
      .from('user_passkeys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', credentialId)

    return { success: true, message: `تم التحقق بنجاح عبر البصمة (${passkey.friendly_name})` }
  } catch (err: any) {
    console.error('[Passkey Auth Exception]:', err)
    if (err.name === 'NotAllowedError') {
      return { success: false, message: 'تم إغلاق نافذة البصمة الذكية.' }
    }
    return { success: false, message: err.message || 'خطأ أثناء تسجيل الدخول بالبصمة.' }
  }
}
