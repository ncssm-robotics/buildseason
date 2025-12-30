import type { FC, PropsWithChildren } from "hono/jsx";

type LayoutProps = PropsWithChildren<{
  title?: string;
}>;

export const Layout: FC<LayoutProps> = ({
  children,
  title = "BuildSeason",
}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {/* Tailwind CSS via CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* HTMX for dynamic interactions */}
        <script
          src="https://unpkg.com/htmx.org@2.0.4"
          integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+"
          crossorigin="anonymous"
        ></script>
        {/* Alpine.js for small client-side state */}
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"
        ></script>
        {/* HTMX config */}
        <meta name="htmx-config" content='{"defaultSwapStyle":"innerHTML"}' />
        {/* App styles */}
        <link rel="stylesheet" href="/public/styles.css" />
      </head>
      <body class="bg-gray-50 text-gray-900" hx-boost="true">
        {children}
      </body>
    </html>
  );
};
