-- Extended profile fields for the full profile edit/view feature.

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS phone_number           VARCHAR(30),
  ADD COLUMN IF NOT EXISTS phone_country_code     VARCHAR(10),
  ADD COLUMN IF NOT EXISTS gender                 VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ethnicity              VARCHAR(80),
  ADD COLUMN IF NOT EXISTS country_of_origin      VARCHAR(80),
  ADD COLUMN IF NOT EXISTS disability_disclosure  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seek_url               TEXT,
  ADD COLUMN IF NOT EXISTS indeed_url             TEXT,
  ADD COLUMN IF NOT EXISTS personal_website_url   TEXT,
  ADD COLUMN IF NOT EXISTS resume_url             TEXT,
  ADD COLUMN IF NOT EXISTS address_line1          TEXT,
  ADD COLUMN IF NOT EXISTS address_line2          TEXT,
  ADD COLUMN IF NOT EXISTS city                   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state_region           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country_name           VARCHAR(100),
  -- Optional public social handles (marketing / comms / content-creator roles)
  ADD COLUMN IF NOT EXISTS facebook_url           TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url          TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url             TEXT;

-- Storage bucket for resume/CV uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to resumes bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'resume_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "resume_insert" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'resumes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'resume_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "resume_select" ON storage.objects FOR SELECT
      USING (bucket_id = 'resumes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'resume_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "resume_delete" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'resumes');
  END IF;
END
$$;
