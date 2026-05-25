import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../services/socket.js'

export function useOpportunityRealtime(opportunityId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!opportunityId) return
    const socket = getSocket()

    function onApplicantAdded({ opportunityId: id }: { opportunityId: string; applicantUserId: string }) {
      if (id !== opportunityId) return
      qc.invalidateQueries({ queryKey: ['opportunity', id] })
    }

    function onApplicantRemoved({ opportunityId: id }: { opportunityId: string; applicantUserId: string }) {
      if (id !== opportunityId) return
      qc.invalidateQueries({ queryKey: ['opportunity', id] })
    }

    function onApplicationAccepted({ opportunityId: id }: { opportunityId: string }) {
      if (id !== opportunityId) return
      qc.invalidateQueries({ queryKey: ['opportunity', id] })
    }

    function onClosed({ opportunityId: id }: { opportunityId: string; reason: string }) {
      if (id !== opportunityId) return
      qc.invalidateQueries({ queryKey: ['opportunity', id] })
    }

    socket.on('opportunity:applicant_added', onApplicantAdded)
    socket.on('opportunity:applicant_removed', onApplicantRemoved)
    socket.on('opportunity:application_accepted', onApplicationAccepted)
    socket.on('opportunity:closed', onClosed)

    return () => {
      socket.off('opportunity:applicant_added', onApplicantAdded)
      socket.off('opportunity:applicant_removed', onApplicantRemoved)
      socket.off('opportunity:application_accepted', onApplicationAccepted)
      socket.off('opportunity:closed', onClosed)
    }
  }, [opportunityId, qc])
}
