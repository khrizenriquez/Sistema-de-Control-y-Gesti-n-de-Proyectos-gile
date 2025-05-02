/**
 * Type definitions for fixAuthentication.js
 */

/**
 * Verifies the current authentication state
 * @returns Promise resolving to a boolean indicating if the user is authenticated
 */
export function checkAuthState(): Promise<boolean>;

/**
 * Debugs the routing system and logs diagnostic information
 * @returns Boolean indicating if debugging was successful
 */
export function debugRouting(): boolean;

/**
 * Forces navigation to a specified route, trying multiple methods
 * @param route The route to navigate to, defaults to '/dashboard'
 * @returns Boolean indicating if navigation was initiated
 */
export function forceNavigation(route?: string): boolean;

/**
 * Comprehensive fix for authentication redirect issues
 * @returns Promise resolving to a boolean indicating success or failure
 */
export function fixAuthRedirect(): Promise<boolean>; 