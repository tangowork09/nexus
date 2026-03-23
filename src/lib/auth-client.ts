import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'
import { phoneNumberClient } from 'better-auth/client/plugins'
import { sentinelClient } from '@better-auth/infra/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    sentinelClient(),
  ],
})

export const { useSession, signIn, signOut, signUp } = authClient
