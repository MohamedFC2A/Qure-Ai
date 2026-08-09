import { createClient } from './client'

const BUCKET_NAME = 'medical_scans'

/**
 * Uploads a medical scan image to the private storage bucket under user_id/profile_id/
 */
export async function uploadPrivateScan(
  file: File,
  userId: string,
  profileId: string
): Promise<{ path: string | null; error: Error | null }> {
  try {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `${userId}/${profileId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[Supabase Storage Upload Error]:', error)
      return { path: null, error: new Error(error.message) }
    }

    return { path: data.path, error: null }
  } catch (err: any) {
    return { path: null, error: err }
  }
}

/**
 * Generates an encrypted, time-limited Signed URL for private medical scan viewing.
 * Defaults to 60 minutes expiry.
 */
export async function getSignedScanUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  try {
    if (!filePath) return null

    // If already a signed or blob URL, return as is
    if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
      return filePath
    }

    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresInSeconds)

    if (error) {
      console.error('[Supabase Signed URL Error]:', error)
      return null
    }

    return data.signedUrl
  } catch (err) {
    console.error('[Signed URL Exception]:', err)
    return null
  }
}
