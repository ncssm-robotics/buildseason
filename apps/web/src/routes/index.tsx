import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold font-display">BuildSeason</span>
              <div className="hidden md:flex gap-6">
                <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
                <a href="#about" className="text-muted-foreground hover:text-foreground">About</a>
                <a href="#docs" className="text-muted-foreground hover:text-foreground">Docs</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold font-display mb-6">
            Stop managing spreadsheets.
            <br />
            <span className="text-primary">Start building robots.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Team management, robot builds, parts, and orders —
            with intelligent Discord assistance for FTC/FRC teams.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button size="lg" variant="outline">See Demo</Button>
          </div>
        </div>
      </section>

      {/* Features placeholder */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-12">
            Everything your team needs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Team Management"
              description="Organize members, roles, and seasons. Handle yearly transitions smoothly."
            />
            <FeatureCard
              title="Robot Builds"
              description="Track multiple robots per season. Manage BOMs and part allocation."
            />
            <FeatureCard
              title="Parts & Orders"
              description="Inventory tracking, vendor management, and streamlined ordering."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border border-border bg-background">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
