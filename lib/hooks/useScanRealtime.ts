'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface MedicationScanRecord {
  id: string
  user_id: string
  profile_id: string
  drug_name: string
  manufacturer?: string
  status: 'PENDING' | 'OCR_PROCESSING' | 'AI_ANALYZING' | 'COMPLETED' | 'FAILED'
  analysis_json: any
  created_at: string
}

/**
 * Custom hook for subscribing to real-time updates of medical scan processing status
 */
export function useScanRealtime(userId: string | null, profileId: string | null) {
  const [scans, setScans] = useState<MedicationScanRecord[]>([])
  const [activeScan, setActiveScan] = useState<MedicationScanRecord | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    if (!userId || !profileId) return

    const supabase = createClient()
    let channel: RealtimeChannel

    // 1. Initial Fetch
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('medication_history')
        .select('*')
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setScans(data as MedicationScanRecord[])
      }
    }

    fetchInitial()

    // 2. Subscribe to Realtime Postgres Changes
    channel = supabase
      .channel(`scans_realtime_${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_history',
          filter: `profile_id=eq.${profileId}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as MedicationScanRecord
            setScans((prev) => [newRecord, ...prev])
            setActiveScan(newRecord)
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as MedicationScanRecord
            setScans((prev) =>
              prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item))
            )
            if (activeScan?.id === updatedRecord.id || updatedRecord.status !== 'COMPLETED') {
              setActiveScan(updatedRecord)
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setScans((prev) => prev.filter((item) => item.id !== deletedId))
          }
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, profileId])

  return { scans, activeScan, isConnected }
}
