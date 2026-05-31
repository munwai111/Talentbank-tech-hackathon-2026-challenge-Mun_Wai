// Same catch-all pattern as sign-in.
// Clerk uses sub-routes for multi-step sign-up flows.

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-zinc-500 mt-1">
            Join thousands of APAC professionals on Career OS
          </p>
        </div>
        {/* forceRedirectUrl always sends new users to onboarding after sign-up */}
        <SignUp forceRedirectUrl="/onboarding" />
      </div>
    </div>
  )
}
