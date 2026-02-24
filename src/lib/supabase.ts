import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a lazy-initialized client that won't error during build
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_supabase) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Return a mock during build/prerender
            return createClient('https://placeholder.supabase.co', 'placeholder-key');
        }
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

export const supabase = typeof window !== 'undefined'
    ? getSupabase()
    : (supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : createClient('https://placeholder.supabase.co', 'placeholder-key'));
