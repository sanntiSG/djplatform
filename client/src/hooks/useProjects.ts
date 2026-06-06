import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore.js'
import { useToastStore } from '../store/useToastStore.js'
import { projectService } from '../services/projectService.js'
import type { CreateProjectInput, UpdateProjectInput, ApplyProjectInput } from '../types/index.js'

const errToast = (msg = 'Algo salio mal. Intenta de nuevo.') =>
  () => useToastStore.getState().show(msg)

/* ── Queries ─────────────────────────────────────────────── */

export function useProjectList(params?: Parameters<typeof projectService.list>[0]) {
  return useQuery({
    queryKey: ['projects', params ?? {}],
    queryFn:  () => projectService.list(params),
    staleTime: 2 * 60_000,
  })
}

export function useProjectsForMe(limit = 6) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['projects', 'for-me', limit],
    queryFn:  () => projectService.forMe(limit),
    enabled:  Boolean(token),
    staleTime: 5 * 60_000,
  })
}

export function useMyProjects() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['projects', 'mine'],
    queryFn:  () => projectService.mine(),
    enabled:  Boolean(token),
    staleTime: 60_000,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn:  () => projectService.getById(id),
    enabled:  Boolean(id),
    staleTime: 30_000,
  })
}

/* ── Mutations ───────────────────────────────────────────── */

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectService.create(data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['projects'] }) },
    onError:    errToast('No se pudo crear el proyecto.'),
  })
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProjectInput) => projectService.update(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['project', id] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: errToast('No se pudo actualizar el proyecto.'),
  })
}

export function useRemoveProject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => projectService.remove(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['projects'] }) },
    onError:    errToast('No se pudo eliminar el proyecto.'),
  })
}

export function useApplyToProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplyProjectInput) => projectService.apply(projectId, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', projectId] }) },
    onError:    errToast('No se pudo enviar la solicitud.'),
  })
}

export function useCancelApply(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => projectService.cancelApply(projectId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', projectId] }) },
    onError:    errToast(),
  })
}

export function useAcceptMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => projectService.acceptMember(projectId, memberId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', projectId] }) },
    onError:    errToast('No se pudo aceptar al miembro.'),
  })
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => projectService.removeMember(projectId, memberId),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['project', projectId] }) },
    onError:    errToast(),
  })
}
