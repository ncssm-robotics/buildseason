import { Hono } from "hono";
import { Layout } from "../components/Layout";
import { SocialAuthButtons } from "../components/SocialAuth";

const app = new Hono();

// Redirect /register to /login (social auth handles both)
app.get("/register", (c) => c.redirect("/login"));

// Login page - social auth only
app.get("/login", (c) => {
  const error = c.req.query("error");

  return c.html(
    <Layout title="Sign In - BuildSeason">
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 class="text-center text-3xl font-bold text-gray-900">
            Sign in to BuildSeason
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Use your GitHub or Google account to continue
          </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p class="text-sm text-red-600">{decodeURIComponent(error)}</p>
              </div>
            )}

            <SocialAuthButtons />
          </div>
        </div>
      </div>
    </Layout>
  );
});

export default app;
