import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a client for browser use with SSR support
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Export a singleton instance for use in client components
export const supabase = createClient();

// Sign out
export async function signOutUser(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error("Unknown error") };
  }
}
