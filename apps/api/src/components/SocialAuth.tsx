import type { FC } from "hono/jsx";

// GitHub SVG icon
const GitHubIcon: FC = () => (
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// Google SVG icon
const GoogleIcon: FC = () => (
  <svg class="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/**
 * Social OAuth buttons for GitHub and Google authentication.
 *
 * IMPLEMENTATION NOTE: We use JavaScript fetch() instead of direct links because:
 * 1. Better-Auth requires JSON content-type (rejects form submissions)
 * 2. Better-Auth returns the OAuth redirect URL in JSON response, not as HTTP redirect
 * 3. Using fetch with credentials: 'include' ensures the OAuth state cookie is saved
 * 4. This approach also bypasses HTMX's hx-boost which would intercept regular links
 */
export const SocialAuthButtons: FC = () => (
  <div class="space-y-3">
    <button
      type="button"
      onclick="signInWithSocial('github')"
      class="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <GitHubIcon />
      <span>Continue with GitHub</span>
    </button>

    <button
      type="button"
      onclick="signInWithSocial('google')"
      class="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <GoogleIcon />
      <span>Continue with Google</span>
    </button>

    <script
      dangerouslySetInnerHTML={{
        __html: `
        async function signInWithSocial(provider) {
          try {
            const res = await fetch('/api/auth/sign-in/social', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider: provider, callbackURL: '/dashboard' }),
              credentials: 'include'
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
            } else if (data.error) {
              alert('Error: ' + data.message);
            }
          } catch (err) {
            console.error('OAuth error:', err);
            alert('Failed to start authentication');
          }
        }
      `,
      }}
    />
  </div>
);

/**
 * Sign out button that properly handles Better-Auth's JSON response.
 * Uses JavaScript fetch to call the sign-out endpoint and redirect on success.
 */
export const SignOutButton: FC<{ class?: string }> = ({ class: className }) => (
  <>
    <button
      type="button"
      onclick="signOut()"
      class={
        className ||
        "px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
      }
    >
      Sign out
    </button>
    <script
      dangerouslySetInnerHTML={{
        __html: `
        async function signOut() {
          try {
            const res = await fetch('/api/auth/sign-out', {
              method: 'POST',
              credentials: 'include'
            });
            if (res.ok) {
              window.location.href = '/login';
            }
          } catch (err) {
            console.error('Sign out error:', err);
            window.location.href = '/login';
          }
        }
      `,
      }}
    />
  </>
);
