import { CandidateHotbar } from './CandidateHotbar'
import { FloatingAIOrb } from '@/components/floating-ai/FloatingAIOrb'

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col" data-journey="candidate">
      <CandidateHotbar />
      <main className="flex-1 bg-background text-foreground">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
      <FloatingAIOrb />
    </div>
  )
}
