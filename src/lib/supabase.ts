import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a stable visitor ID (persisted in localStorage)
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("nw-visitor-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("nw-visitor-id", id);
  }
  return id;
}
