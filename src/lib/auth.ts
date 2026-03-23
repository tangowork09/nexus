import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { emailOTP } from 'better-auth/plugins'
import { prisma } from '@/lib/prisma'

import { Resend } from 'resend'

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET!,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  user: {
    additionalFields: {
      role: { type: 'string', required: false },
      onboarded: { type: 'boolean', required: false },
      designation: { type: 'string', required: false },
    },
  },

  emailAndPassword: {
    enabled: false,
  },

  plugins: [
    emailOTP({
      ...(process.env.NODE_ENV !== 'production' ? { generateOTP: () => '111000' } : {}),
      async sendVerificationOTP({ email, otp, type }) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEV] Skipped actual email. OTP for ${email} is ${otp}`);
          return;
        }

        const resend = new Resend(process.env.RESEND_API_KEY)
        try {
          await resend.emails.send({
            from: 'Nexus <onboarding@resend.dev>',
            to: email,
            subject: 'Your Nexus Verification Code',
            html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`,
          })
          console.log(`[PROD] Sent Email OTP to ${email}`)
        } catch (error) {
          console.error('Failed to send OTP:', error)
          throw error
        }
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
