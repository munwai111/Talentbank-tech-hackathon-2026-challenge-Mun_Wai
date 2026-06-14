// Server-side owner check — returns true only for the app owner's accounts.
// Used to gate developer/admin controls that judges must never see.

import { currentUser } from '@clerk/nextjs/server'

const OWNER_EMAILS = new Set([
  'munwai3939728@gmail.com',
  'l_munwai@yahoo.com',
])

export async function isOwner(): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false
  return user.emailAddresses.some(e => OWNER_EMAILS.has(e.emailAddress.toLowerCase()))
}
