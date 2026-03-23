import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { emailOTP } from 'better-auth/plugins'
import { phoneNumber } from 'better-auth/plugins'
import { dash } from '@better-auth/infra'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_API_KEY!,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID ?? 'common',
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // TODO: replace with Resend / SendGrid in production
        console.log(`[DEV] Email OTP for ${email} (${type}): ${otp}`)
      },
      expiresIn: 300, // 5 minutes
    }),

    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, otp }) => {
        // TODO: replace with Twilio Verify in production
        console.log(`[DEV] SMS OTP for ${phone}: ${otp}`)
      },
      expiresIn: 300,
    }),

    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY!,
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
