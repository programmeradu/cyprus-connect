/**
 * Open access to the /app workspace.
 *
 * While this is `true`, the middleware auth gate and the onboarding redirect
 * are bypassed so /app can be browsed without a session. It is now `false`:
 * every /app page needs a signed-in account, and the console reads only the
 * workspace that account owns.
 */
export const APP_OPEN_ACCESS = false;

