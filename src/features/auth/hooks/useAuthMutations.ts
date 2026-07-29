import { useMutation } from '@tanstack/react-query'

import { useAuth } from './useAuth'

export function useRegisterWithEmailAndPassword() {
  const { registerWithEmailAndPassword } = useAuth()

  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      readonly email: string
      readonly password: string
    }) => registerWithEmailAndPassword(email, password),
    retry: false,
  })
}

export function useSignInWithEmailAndPassword() {
  const { signInWithEmailAndPassword } = useAuth()

  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      readonly email: string
      readonly password: string
    }) => signInWithEmailAndPassword(email, password),
    retry: false,
  })
}

export function useSignOut() {
  const { signOut } = useAuth()

  return useMutation({
    mutationFn: signOut,
    retry: false,
  })
}

export function useSendPasswordResetEmail() {
  const { sendPasswordResetEmail } = useAuth()

  return useMutation({
    mutationFn: sendPasswordResetEmail,
    retry: false,
  })
}
