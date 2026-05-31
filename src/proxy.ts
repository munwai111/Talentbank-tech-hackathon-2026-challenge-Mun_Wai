import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',               // Landing page
  '/sign-in(.*)',    // Sign in page and sub-routes
  '/sign-up(.*)',    // Sign up page and sub-routes
  '/api/webhooks(.*)', // Clerk webhooks (called by Clerk's servers, not users)
])

export default clerkMiddleware(async (auth, request) => {
  // If it's NOT a public route, protect it (redirect to sign-in if no session)
  if (!isPublicRoute(request)) {
    // Explicitly redirect to our local sign-in page (not Clerk's hosted page)
    // so preview tools and iframe embeds can render it on localhost.
    await auth.protect({
      unauthenticatedUrl: new URL('/sign-in', request.url).toString(),
    })
  }
})

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
