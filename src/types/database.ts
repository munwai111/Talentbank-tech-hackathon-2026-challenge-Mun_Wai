// This file mirrors our Supabase database schema as TypeScript types.
// Update this whenever you change the DB schema.
//
// ⚠️  Critical shape requirement for Supabase's createClient<Database>:
//   • Each table must have: Row, Insert, Update, AND Relationships: []
//   • The public schema must have: Tables, Views, Functions
//   • Missing any field causes TypeScript to infer 'never' for all table ops.
//
// Source: node_modules/@supabase/postgrest-js/src/types/common/common.ts → GenericTable

export type UserRole = 'candidate' | 'employer'

// ── Rich profile blobs stored as JSONB ───────────────────────────────────────
// These live in candidate_profiles.career_data and companies.culture_data.
// JSONB lets us evolve the shape without DB migrations for every new field.

// ── Imported history blobs (from resume / paste-text import) ─────────────────
// Stored as JSONB in candidate_profiles.work_experience and .education.
// Imported by the AI extraction pipeline; not manually edited by the user.

export type WorkExperienceEntry = {
  title: string
  company: string
  start_date: string | null        // "2021-03" format where possible
  end_date: string | null          // null = current role
  duration_months: number | null   // AI-estimated from dates
  description: string | null       // Full raw description (kept for coach/navigator context)
  key_technologies: string[]       // Tech stack mentioned in this role
  // ── AI-structured presentation fields (auto-populated on CV upload) ─────────
  key_impacts?: string[]           // 2–4 bullets: what they drove/contributed (with numbers where present)
  key_skills?: string[]            // Skills specifically gained or applied in this role
  achievements?: string[]          // Notable milestones, promotions, awards, firsts
  role_context?: string            // One sentence: why this role was unique/important
  // Guided registration additions
  employment_type?: 'full_time' | 'part_time' | 'freelance' | 'contract' | 'internship' | null
  verification_status?: 'unverified' | 'email_sent' | 'document_uploaded' | 'verified'
  verification_email?: string | null
}

export type EducationEntry = {
  institution: string
  degree: string | null            // e.g. "Bachelor of Science"
  field: string | null             // e.g. "Computer Science"
  graduation_year: number | null
  // Guided registration additions
  mqf_level?: string | null        // MQF Level 1–8 or "high_school"
  start_year?: number | null
  currently_enrolled?: boolean
  document_uploaded?: boolean
}

// ── Guided registration — SAQ (Short Answer Questions) ───────────────────────
// Stored as JSONB in candidate_profiles.saq_data
export type SaqData = {
  // Section A: Goals (mirrors career_data — stored here for onboarding flow)
  goal_1_year: string | null
  goal_5_year: string | null
  dream_role: string | null
  // Section B: Korn Ferry-style character assessment
  character_responses: Record<string, string>   // questionId → selected option key
  // Section C: Hobbies
  personal_hobbies: string[]
  professional_interests: string[]
  // Section D: Strengths & Weaknesses (scenario-based)
  strength_scenario: string | null              // selected scenario response key
  weakness_scenario: string | null
  // Section E: Platform Intention
  platform_intention: string | null
  current_situation_intent: string | null
  intention_why: string | null                  // free-text "why" context
}

export type ProfileStatusType =
  | 'open_to_work'
  | 'open_to_opportunities'
  | 'currently_studying'
  | 'graduated_bachelor'
  | 'graduated_master'
  | 'graduated_phd'
  | 'career_break'
  | 'hiring'
  | 'custom'
  | 'none'

export type CareerData = {
  // Current situation
  current_situation: 'student' | 'fresh_grad' | 'employed' | 'career_changer' | null
  // Profile status badge (displayed on public profile)
  status_type?: ProfileStatusType
  status_custom_text?: string   // AI-vetted custom text, only set when status_type === 'custom'
  // Education
  education_level: 'high_school' | 'diploma' | 'degree' | 'masters' | 'phd' | 'self_taught' | null
  education_field: string | null
  education_institution: string | null
  graduation_year: number | null
  // Experience context
  years_experience: number | null
  current_or_last_role: string | null
  current_or_last_company: string | null
  key_achievements: string | null
  // Job preferences
  preferred_industries: string[]
  preferred_job_functions: string[]
  preferred_company_types: string[]
  preferred_work_arrangement: 'onsite' | 'hybrid' | 'remote' | 'flexible' | null
  open_to_relocation: boolean
  preferred_locations: string[]
  // Values & work style
  values_priorities: string[]    // e.g. ["growth", "impact", "salary", "flexibility"]
  work_style: string[]           // e.g. ["collaborative", "fast-paced", "creative"]
  why_this_field: string | null  // What drew them to their field
  // Goals
  goal_1_year: string | null
  goal_5_year: string | null
  dream_role: string | null
  deal_breakers: string | null
  // Life chapter context (C-05)
  life_chapter_context: string | null      // Free-text life constraints for path navigation
  // AI synthesis
  career_identity_summary: string | null   // Claude-generated narrative
  synthesized_at: string | null
}

export type CultureData = {
  // Culture descriptors
  culture_tags: string[]             // e.g. ["startup-y", "mission-driven", "flat hierarchy"]
  work_arrangements: string[]        // ["remote", "hybrid", "onsite"]
  // Employer value prop
  why_work_here: string | null       // What makes them a great employer
  employee_growth_path: string | null // How careers progress here
  // Hiring criteria
  cultural_fit_criteria: string[]    // ["ownership mindset", "growth mindset", "team player"]
  benefits: string[]                 // ["Medical", "EPF", "Annual bonus", "Flexible hours"]
  typical_roles: string[]            // Roles they commonly hire for
  // AI synthesis
  employer_identity_summary: string | null
  synthesized_at: string | null
}

export type Database = {
  public: {
    Tables: {
      // ── users ────────────────────────────────────────────────────
      // Created automatically when Clerk fires a "user.created" webhook.
      // clerk_id links our DB user to Clerk's auth system.
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          role: UserRole
          created_at: string
          // Soft-delete fields
          deleted_at: string | null
          deletion_reason: string | null
          deletion_feedback: string | null
          scheduled_purge_at: string | null
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          role: UserRole
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_feedback?: string | null
          scheduled_purge_at?: string | null
        }
        Update: {
          clerk_id?: string
          role?: UserRole
          email?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          deletion_feedback?: string | null
          scheduled_purge_at?: string | null
        }
        Relationships: []
      }

      // ── candidate_profiles ───────────────────────────────────────
      // One-to-one with users (where role = 'candidate').
      // embedding: 1536-dimension vector for AI skill matching.
      candidate_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          headline: string | null
          bio: string | null
          location: string | null
          github_url: string | null
          linkedin_url: string | null
          salary_min: number | null
          salary_max: number | null
          availability: 'immediate' | 'one_month' | 'three_months' | 'not_looking'
          embedding: number[] | null  // pgvector — generated from skills
          career_data: CareerData | null          // JSONB — rich career identity profile
          work_experience: WorkExperienceEntry[] | null  // JSONB — imported work history
          education: EducationEntry[] | null             // JSONB — imported education
          // Guided registration fields
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          date_of_birth: string | null              // ISO date e.g. "1998-04-15"
          saq_data: SaqData | null                  // JSONB — SAQ responses
          onboarding_completed: boolean
          verified_candidate: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          headline?: string | null
          bio?: string | null
          location?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          salary_min?: number | null
          salary_max?: number | null
          availability?: 'immediate' | 'one_month' | 'three_months' | 'not_looking'
          embedding?: number[] | null
          career_data?: CareerData | null
          work_experience?: WorkExperienceEntry[] | null
          education?: EducationEntry[] | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          saq_data?: SaqData | null
          onboarding_completed?: boolean
          verified_candidate?: boolean
        }
        Update: {
          name?: string
          headline?: string | null
          bio?: string | null
          location?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          salary_min?: number | null
          salary_max?: number | null
          availability?: 'immediate' | 'one_month' | 'three_months' | 'not_looking'
          embedding?: number[] | null
          career_data?: CareerData | null
          work_experience?: WorkExperienceEntry[] | null
          education?: EducationEntry[] | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          saq_data?: SaqData | null
          onboarding_completed?: boolean
          verified_candidate?: boolean
        }
        Relationships: [
          { foreignKeyName: 'candidate_profiles_user_id_fkey'; columns: ['user_id']; isOneToOne: true; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }

      // ── skills ───────────────────────────────────────────────────
      // Each skill is linked to a candidate. Level 1–5.
      // source: 'manual' (user entered) | 'import' (AI resume import) | 'github' (AI extracted) | 'assessment'
      skills: {
        Row: {
          id: string
          candidate_id: string
          name: string
          level: 1 | 2 | 3 | 4 | 5
          source: 'manual' | 'import' | 'github' | 'assessment'
          evidence_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          name: string
          level: 1 | 2 | 3 | 4 | 5
          source: 'manual' | 'import' | 'github' | 'assessment'
          evidence_url?: string | null
        }
        Update: {
          level?: 1 | 2 | 3 | 4 | 5
          source?: 'manual' | 'github' | 'assessment'
          evidence_url?: string | null
        }
        Relationships: [
          { foreignKeyName: 'skills_candidate_id_fkey'; columns: ['candidate_id']; isOneToOne: false; referencedRelation: 'candidate_profiles'; referencedColumns: ['id'] }
        ]
      }

      // ── portfolio_items ──────────────────────────────────────────
      // The "Living Portfolio" — projects, freelance work, contributions.
      portfolio_items: {
        Row: {
          id: string
          candidate_id: string
          title: string
          description: string | null
          url: string | null
          repo_url: string | null
          tech_stack: string[]        // e.g. ["React", "Node.js", "PostgreSQL"]
          impact: string | null       // "Reduced load time by 40%"
          ai_summary: string | null   // AI-generated summary of what this shows
          created_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          title: string
          description?: string | null
          url?: string | null
          repo_url?: string | null
          tech_stack?: string[]
          impact?: string | null
          ai_summary?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          url?: string | null
          repo_url?: string | null
          tech_stack?: string[]
          impact?: string | null
          ai_summary?: string | null
        }
        Relationships: [
          { foreignKeyName: 'portfolio_items_candidate_id_fkey'; columns: ['candidate_id']; isOneToOne: false; referencedRelation: 'candidate_profiles'; referencedColumns: ['id'] }
        ]
      }

      // ── companies ────────────────────────────────────────────────
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          industry: string | null
          size: 'startup' | 'sme' | 'mid' | 'large' | null
          description: string | null
          website: string | null
          logo_url: string | null
          culture_data: CultureData | null  // JSONB — culture, values, what they look for
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          industry?: string | null
          size?: 'startup' | 'sme' | 'mid' | 'large' | null
          description?: string | null
          website?: string | null
          logo_url?: string | null
          culture_data?: CultureData | null
        }
        Update: {
          name?: string
          industry?: string | null
          size?: 'startup' | 'sme' | 'mid' | 'large' | null
          description?: string | null
          website?: string | null
          logo_url?: string | null
          culture_data?: CultureData | null
        }
        Relationships: [
          { foreignKeyName: 'companies_user_id_fkey'; columns: ['user_id']; isOneToOne: true; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }

      // ── jobs ─────────────────────────────────────────────────────
      // embedding: generated from title + description + required_skills
      jobs: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string
          required_skills: string[]
          nice_to_have_skills: string[]
          salary_min: number | null
          salary_max: number | null
          location: string | null
          remote: 'onsite' | 'hybrid' | 'remote'
          status: 'draft' | 'open' | 'closed'
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description: string
          required_skills?: string[]
          nice_to_have_skills?: string[]
          salary_min?: number | null
          salary_max?: number | null
          location?: string | null
          remote?: 'onsite' | 'hybrid' | 'remote'
          status?: 'draft' | 'open' | 'closed'
          embedding?: number[] | null
        }
        Update: {
          title?: string
          description?: string
          required_skills?: string[]
          nice_to_have_skills?: string[]
          salary_min?: number | null
          salary_max?: number | null
          location?: string | null
          remote?: 'onsite' | 'hybrid' | 'remote'
          status?: 'draft' | 'open' | 'closed'
          embedding?: number[] | null
        }
        Relationships: [
          { foreignKeyName: 'jobs_company_id_fkey'; columns: ['company_id']; isOneToOne: false; referencedRelation: 'companies'; referencedColumns: ['id'] }
        ]
      }

      // ── matches ──────────────────────────────────────────────────
      // AI-generated match between a candidate and a job.
      // score: 0.0–1.0 cosine similarity
      // gap_analysis: JSON explaining what's missing
      matches: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          score: number
          gap_analysis: {
            matched_skills: string[]
            missing_skills: { skill: string; importance: 'critical' | 'nice_to_have' }[]
            recommendations: string[]
          } | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          score: number
          gap_analysis?: Database['public']['Tables']['matches']['Row']['gap_analysis']
        }
        Update: {
          score?: number
          gap_analysis?: Database['public']['Tables']['matches']['Row']['gap_analysis']
        }
        Relationships: [
          { foreignKeyName: 'matches_job_id_fkey'; columns: ['job_id']; isOneToOne: false; referencedRelation: 'jobs'; referencedColumns: ['id'] },
          { foreignKeyName: 'matches_candidate_id_fkey'; columns: ['candidate_id']; isOneToOne: false; referencedRelation: 'candidate_profiles'; referencedColumns: ['id'] }
        ]
      }

      // ── applications ─────────────────────────────────────────────
      applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          match_id: string | null
          status: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          match_id?: string | null
          status?: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
        }
        Update: {
          status?: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
        }
        Relationships: [
          { foreignKeyName: 'applications_job_id_fkey'; columns: ['job_id']; isOneToOne: false; referencedRelation: 'jobs'; referencedColumns: ['id'] },
          { foreignKeyName: 'applications_candidate_id_fkey'; columns: ['candidate_id']; isOneToOne: false; referencedRelation: 'candidate_profiles'; referencedColumns: ['id'] }
        ]
      }

      // ── employer_signals ─────────────────────────────────────────
      // THE FEEDBACK LOOP. Every employer action is recorded here.
      // Future: use these signals to re-weight the matching algorithm.
      employer_signals: {
        Row: {
          id: string
          application_id: string
          company_id: string
          candidate_id: string
          signal_type: 'shortlisted' | 'rejected' | 'interviewed' | 'hired' | 'not_hired'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          company_id: string
          candidate_id: string
          signal_type: 'shortlisted' | 'rejected' | 'interviewed' | 'hired' | 'not_hired'
          reason?: string | null
        }
        Update: Record<string, never>  // Signals are immutable — never update, only insert
        Relationships: [
          { foreignKeyName: 'employer_signals_application_id_fkey'; columns: ['application_id']; isOneToOne: false; referencedRelation: 'applications'; referencedColumns: ['id'] }
        ]
      }

      // ── coaching_sessions ────────────────────────────────────────
      // Stores the AI coaching conversation history per candidate.
      coaching_sessions: {
        Row: {
          id: string
          candidate_id: string
          messages: {
            role: 'user' | 'assistant'
            content: string
            timestamp: string
          }[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          messages?: Database['public']['Tables']['coaching_sessions']['Row']['messages']
        }
        Update: {
          messages?: Database['public']['Tables']['coaching_sessions']['Row']['messages']
        }
        Relationships: [
          { foreignKeyName: 'coaching_sessions_candidate_id_fkey'; columns: ['candidate_id']; isOneToOne: true; referencedRelation: 'candidate_profiles'; referencedColumns: ['id'] }
        ]
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      // Our custom SQL matching functions (defined in supabase/schema.sql)
      match_jobs_for_candidate: {
        Args: { candidate_embedding: number[]; match_count?: number }
        Returns: { job_id: string; score: number; title: string; company_id: string }[]
      }
      match_candidates_for_job: {
        Args: { job_embedding: number[]; match_count?: number }
        Returns: { candidate_id: string; score: number; name: string }[]
      }
    }

    Enums: {
      [_ in never]: never
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience shorthand types — use these throughout the app instead of
// Database['public']['Tables']['users']['Row'] everywhere
export type User = Database['public']['Tables']['users']['Row']
export type CandidateProfile = Database['public']['Tables']['candidate_profiles']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type PortfolioItem = Database['public']['Tables']['portfolio_items']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type EmployerSignal = Database['public']['Tables']['employer_signals']['Row']
export type CoachingSession = Database['public']['Tables']['coaching_sessions']['Row']

// Gap analysis type extracted for reuse
export type GapAnalysis = NonNullable<Match['gap_analysis']>
