// Supabase configuration
const SUPABASE_URL = 'https://cqrtczrltjdqrolhpryp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcnRjenJsdGpkcXJvbGhwcnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODM0ODgsImV4cCI6MjA4MjE1OTQ4OH0.cMoeV5geq70I7pNX4DFTnl4oMFd_MNpETEsyKYK-WBY';

// Initialize Supabase client using the global supabase object from CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabase = supabaseClient;
