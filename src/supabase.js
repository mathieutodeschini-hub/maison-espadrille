import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmjyhvckddcvvmrqwdms.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanlodmNrZGRjdnZtcnF3ZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjMxMTcsImV4cCI6MjA5MjQzOTExN30.m_kxYkVEqyh46tjgkLNeDITtC6IxvArkMP7nCEsDEnA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
