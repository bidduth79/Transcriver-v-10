import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigValid = !!(supabaseUrl && supabaseKey);

// Return a dummy client that gracefully rejects if not configured
const dummyClient = {
    from: () => ({
        select: async () => ({ data: null, error: new Error("Supabase not configured") }),
        upsert: async () => ({ data: null, error: new Error("Supabase not configured") }),
        delete: () => ({
            eq: async () => ({ data: null, error: new Error("Supabase not configured") })
        })
    })
};

export const supabase = isConfigValid 
  ? createClient(supabaseUrl, supabaseKey) 
  : dummyClient as any;
