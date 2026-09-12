import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftrjvvsfjxmxwqvbskic.supabase.co';
const supabaseKey = 'sb_publishable_QlYLAYvpo4soS0tK2RTmiA_V2D-o940';

export const supabase = createClient(supabaseUrl, supabaseKey);
