import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ekezjmhpdzydiczspfsm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZXpqbWhwZHp5ZGljenNwZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODU5MzcsImV4cCI6MjA4MDA2MTkzN30.WhOebC0eJ73ztpnRT0bUbyPdt9yvCkJN3EuyT7SAVPA';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
