// Clerk's catch-all route pattern [[...sign-in]] is required.
// Clerk uses sub-routes like /sign-in/factor-one, /sign-in/sso-callback, etc.
// The [[...]] syntax catches all of them under this one page.

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-zinc-500 mt-1">Sign in to Career OS</p>
        </div>
        {/* Clerk handles everything: email/password, OAuth, MFA, verification */}
        {/* forceRedirectUrl overrides any Clerk fallback — always go to dashboard after sign-in */}
        <SignIn forceRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}
