import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://ftrjvvsfjxmxwqvbskic.supabase.co';

export const sanitizeSupabaseUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return defaultSupabaseUrl;
  let trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return defaultSupabaseUrl;

  // Remove surrounding quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch (e) {
    return defaultSupabaseUrl;
  }
  return defaultSupabaseUrl;
};

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null) || '').trim();

// Validate that the key is a genuine Supabase JWT token (starts with eyJ... and has valid length)
const isConfigValid = !!(
  supabaseUrl && 
  /^https?:\/\//i.test(supabaseUrl) && 
  supabaseKey && 
  supabaseKey.startsWith('eyJ') &&
  supabaseKey.length > 40
);

export const currentSupabaseUrl = supabaseUrl;

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

let clientInstance: any = dummyClient;

if (isConfigValid) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn('Could not initialize Supabase client, falling back to safe dummy client:', err);
    clientInstance = dummyClient;
  }
} else if (supabaseKey) {
  console.warn('Supabase Anon Key appears invalid (not a valid JWT format). Please update VITE_SUPABASE_ANON_KEY in .env');
}

/** Whether Supabase is properly configured */
export const isSupabaseConfigured = isConfigValid && clientInstance !== dummyClient;

export const supabase = clientInstance;
