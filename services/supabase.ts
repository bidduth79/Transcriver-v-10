import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that the key looks like a proper JWT (contains dots for header.payload.signature)
const isConfigValid = !!(supabaseUrl && supabaseKey && String(supabaseKey).includes('.'));

/** Whether Supabase is properly configured */
export const isSupabaseConfigured = isConfigValid;

const notConfiguredError = new Error("Supabase not configured");

// Chainable no-op result for query builder pattern
const createChainableResult = () => {
    const chainable: any = {
        select: () => chainable,
        eq: () => chainable,
        neq: () => chainable,
        gt: () => chainable,
        lt: () => chainable,
        gte: () => chainable,
        lte: () => chainable,
        like: () => chainable,
        ilike: () => chainable,
        in: () => chainable,
        order: () => chainable,
        limit: () => chainable,
        range: () => chainable,
        single: () => chainable,
        maybeSingle: () => chainable,
        then: (resolve: any) => resolve({ data: null, error: notConfiguredError }),
    };
    return chainable;
};

// Return a dummy client that gracefully handles all query patterns when Supabase is not configured
const dummyClient = {
    from: () => ({
        select: () => createChainableResult(),
        insert: async () => ({ data: null, error: notConfiguredError }),
        upsert: async () => ({ data: null, error: notConfiguredError }),
        update: () => createChainableResult(),
        delete: () => createChainableResult(),
    })
};

if (!isConfigValid && supabaseKey) {
    console.warn('Supabase Anon Key appears invalid (not a valid JWT format). Please update VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = isConfigValid 
  ? createClient(supabaseUrl, supabaseKey) 
  : dummyClient as any;
