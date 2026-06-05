/**
 * Ponto de entrada do Supabase para Client Components.
 *
 * Para Server Components: importe de `@/lib/supabase/server`
 * Para middleware: importe de `@/lib/supabase/middleware`
 */
export { createClient, createClient as createBrowserClient } from "./supabase/client";
