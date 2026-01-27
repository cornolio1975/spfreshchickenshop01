import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rujkkngxyuoahrkbdnyq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1amtrbmd4eXVvYWhya2JkbnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MTkwOTYsImV4cCI6MjA4NDk5NTA5Nn0.itN0MnSuKsvE00Wchb7y_2Q2WmH-k9nYY08bofffu1c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
