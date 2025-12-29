import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/vendors")({
  component: VendorsPage,
});

function VendorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold">
            BuildSeason
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold">FTC Vendor Directory</h2>
        <p className="mb-8 text-muted-foreground">
          Browse trusted suppliers for FTC robotics parts
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold">Vendor list coming soon...</h3>
          </div>
        </div>
      </main>
    </div>
  );
}
