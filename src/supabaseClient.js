import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://iiuavhcrdjsfumqtlbvj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdWF2aGNyZGpzZnVtcXRsYnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzYxMDQsImV4cCI6MjA4NTQxMjEwNH0.EunS16EuC3DmTGEhG1xLQsSCPjsyJh40So-BgEDVHKs'
)
