const SUPABASE_URL = 'https://ehdbosoixhorbejjgcaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZGJvc29peGhvcmJlampnY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NzU0MTcsImV4cCI6MjA2MTI1MTQxN30.Oi0zo_bV-vF-9EC-2syHDs00oxI7zRkMjZeGSa3v0tc';

// Initialize Supabase client
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
