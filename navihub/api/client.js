import { createClinet } from '@supabase/supabase-js';

const client = createClinet(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default client;