/**
 * TEMPORARY: open access to the /app workspace.
 *
 * While this is `true`, the middleware auth gate and the onboarding redirect
 * are bypassed so /app can be browsed without a session.
 * Set to `false` to restore normal authentication.
 */
export const APP_OPEN_ACCESS = true;
