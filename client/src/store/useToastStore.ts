import { create } from 'zustand'

interface ToastState {
  message: string | null
  variant: 'error' | 'success' | 'info'
  show: (message: string, variant?: 'error' | 'success' | 'info') => void
  dismiss: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: 'error',
  show: (message, variant = 'error') => set({ message, variant }),
  dismiss: () => set({ message: null }),
}))
