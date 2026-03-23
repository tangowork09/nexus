/**
 * Maps raw API / network errors to user-friendly copy.
 * Default: "It's not you, it's us." for anything unexpected.
 */
export function friendlyError(e: unknown): string {
  const raw = (e instanceof Error ? e.message : String(e)).toLowerCase()

  if (raw.includes('invalid otp') || raw.includes('invalid code') || raw.includes('incorrect')) {
    return "That code doesn't match. Double-check and try again."
  }
  if (raw.includes('expired')) {
    return 'That code has expired. Hit resend to get a new one.'
  }
  if (raw.includes('rate') || raw.includes('too many')) {
    return "Too many attempts. Give it a minute, then try again."
  }
  if (raw.includes('not found') || raw.includes('no user') || raw.includes('user not found')) {
    return "We couldn't find an account with those details."
  }
  if (raw.includes('already') || raw.includes('exists')) {
    if (raw.includes('username')) return 'That username is already taken. Try another!'
    return 'An account with those details already exists. Try signing in instead.'
  }
  if (raw.includes('network') || raw.includes('fetch') || raw.includes('failed to fetch')) {
    return "Can't reach our servers. Check your connection and try again."
  }

  // Catch-all: If it's a short, specific message from our API, just show it.
  if (e instanceof Error && e.message.length < 60 && !e.message.includes('\n')) {
     return e.message
  }

  // Generic fallback
  return "It's not you, it's us. Something went wrong on our end — please try again."
}
