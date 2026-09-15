// =====================================================================
// Supabase connection.
// Get these from: Supabase Dashboard > Project Settings > API
// The anon/public key is SAFE to expose in client code (that's what
// it's for) — real security comes from the Row Level Security policies
// in sql/schema.sql, not from hiding this key.
// =====================================================================
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
