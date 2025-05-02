/**
 * Type definitions for supabaseDebugger.js
 */

/**
 * Verifies if the environment variables for Supabase are correctly set up
 * @returns Object with flags indicating if URL and key are present
 */
export function checkEnvVariables(): { hasUrl: boolean; hasKey: boolean };

/**
 * Tests if the application can successfully connect to Supabase
 * @returns Promise resolving to a boolean indicating success or failure
 */
export function checkSupabaseConnectivity(): Promise<boolean>;

/**
 * Searches the DOM for any instances of "Login exitoso" messages
 * @returns Boolean indicating if any such messages were found
 */
export function findLoginMessages(): boolean;

/**
 * Runs all diagnostic functions and reports results to the console
 */
export function runDiagnostics(): void; 