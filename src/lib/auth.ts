import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { emailOTP } from 'better-auth/plugins'
import { dash } from '@better-auth/infra'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_API_KEY!,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: false,
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await resend.emails.send({
            from: 'Nexus <onboarding@resend.dev>',
            to: email,
            subject: 'Your Nexus Verification Code',
            html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`,
          })
          console.log(`[DEV] Sent Email OTP to ${email}: ${otp}`)
        } catch (error) {
          console.error('Failed to send OTP:', error)
          throw error
        }
      },
      expiresIn: 300, // 5 minutes
    }),

    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY!,
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
