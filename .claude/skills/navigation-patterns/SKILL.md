---
name: navigation-patterns
description: >-
  TanStack Router and sidebar navigation patterns for BuildSeason.
  Use when creating routes, modifying sidebar structure, adding nav items,
  implementing breadcrumbs, or fixing navigation issues.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Navigation Patterns

Patterns for TanStack Router file-based routing and sidebar navigation.

## Related Skills

- **brand-guidelines** - Styling for nav items, sections
- **ui-design-review** - Testing navigation flows

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx           # Root layout (sidebar, header)
│   ├── index.tsx            # Marketing page (/)
│   ├── login.tsx            # Auth (/login)
│   ├── dashboard.tsx        # Logged-in home (/dashboard)
│   ├── onboarding.tsx       # Team creation
│   ├── vendors.tsx          # Global vendors (/vendors)
│   └── team/
│       └── $program/
│           └── $number/
│               ├── index.tsx       # Team dashboard
│               ├── parts/          # Parts routes
│               ├── robots/         # Robots routes
│               ├── orders/         # Orders routes
│               ├── members/        # Team members
│               └── settings/       # Team settings
└── components/
    └── layout/
        ├── app-sidebar.tsx   # Main sidebar
        └── app-header.tsx    # Top header with breadcrumbs
```

## TanStack Router Conventions

### File-Based Routing

```tsx
// routes/team/$program/$number/parts/index.tsx
// Maps to: /team/:program/:number/parts

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team/$program/$number/parts/")({
  component: PartsPage,
});

function PartsPage() {
  // Access route params
  const { program, number } = Route.useParams();
  return (
    <div>
      Team {program} #{number} Parts
    </div>
  );
}
```

### Route Parameters

```tsx
// Access params in components
const { program, number } = Route.useParams();

// Build team-scoped paths
const teamPath = `/team/${program}/${number}`;
```

### Route Loaders

```tsx
export const Route = createFileRoute("/team/$program/$number/parts/")({
  loader: async ({ params }) => {
    const { program, number } = params;
    return { parts: await fetchParts(program, number) };
  },
  component: PartsPage,
});

function PartsPage() {
  const { parts } = Route.useLoaderData();
}
```

## Sidebar Structure

### Section Organization

```tsx
// OVERVIEW - Team health at a glance
const overviewNavItems = [
  { title: "Dashboard", icon: Home, path: "" },
  { title: "Calendar", icon: Calendar, path: "/calendar" },
];

// BUILD - Technical work
const buildNavItems = [
  { title: "Robots", icon: Bot, path: "/robots" },
  { title: "Parts", icon: Package, path: "/parts" },
  { title: "Orders", icon: ShoppingCart, path: "/orders" },
  { title: "Vendors", icon: Store, path: "/vendors" },
];

// TEAM - Team management
const teamNavItems = [
  { title: "Members", icon: Users, path: "/members" },
  { title: "Settings", icon: Settings, path: "/settings" },
];
```

### Nav Item Component

```tsx
interface NavItem {
  title: string;
  icon: LucideIcon;
  path: string;
}

function NavMenuItem({ item, teamPath }: { item: NavItem; teamPath: string }) {
  const fullPath = `${teamPath}${item.path}`;
  const isActive = useIsActive(fullPath);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={fullPath}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
```

### Active State Detection

```tsx
import { useRouterState } from "@tanstack/react-router";

function useIsActive(path: string): boolean {
  const { location } = useRouterState();
  // Exact match or starts with path
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
}
```

## Breadcrumbs

### Header Implementation

```tsx
// app-header.tsx
function AppHeader() {
  const { location } = useRouterState();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <header>
      <Breadcrumb>
        {segments.map((segment, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbLink to={buildPath(segments, index)}>
              {formatSegment(segment)}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    </header>
  );
}
```

### Segment Formatting

```tsx
const segmentLabels: Record<string, string> = {
  team: "Team",
  parts: "Parts",
  robots: "Robots",
  orders: "Orders",
  members: "Members",
  settings: "Settings",
};

function formatSegment(segment: string): string {
  return segmentLabels[segment] || segment;
}
```

## Adding New Routes

### 1. Create Route File

```bash
# Create new route
touch src/routes/team/\$program/\$number/calendar/index.tsx
```

### 2. Implement Route

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/team/$program/$number/calendar/")({
  component: CalendarPage,
});

function CalendarPage() {
  const { program, number } = Route.useParams();
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold font-display">Calendar</h1>
      {/* Content */}
    </div>
  );
}
```

### 3. Add to Sidebar

```tsx
// In app-sidebar.tsx
const overviewNavItems = [
  { title: "Dashboard", icon: Home, path: "" },
  { title: "Calendar", icon: Calendar, path: "/calendar" }, // Add here
];
```

### 4. Regenerate Route Tree

```bash
bun run dev  # Auto-regenerates routeTree.gen.ts
```

## UI Preferences Storage

For persistent sidebar state (collapse/expand):

```tsx
// hooks/useUIPreferences.ts
const UI_PREFS_KEY = "buildseason-ui-prefs";

interface UIPreferences {
  sidebarCollapsed: boolean;
  // Add more as needed
}

export function useUIPreferences() {
  const [prefs, setPrefs] = useState<UIPreferences>(() => {
    const stored = localStorage.getItem(UI_PREFS_KEY);
    return stored ? JSON.parse(stored) : { sidebarCollapsed: false };
  });

  const updatePrefs = (updates: Partial<UIPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(UI_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { prefs, updatePrefs };
}
```

## Org/Team Picker Pattern

For sidebar header with org/team selection:

```tsx
function OrgTeamPicker() {
  const { currentTeam, teams } = useTeamContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentTeam.logo} />
            <AvatarFallback>{currentTeam.initials}</AvatarFallback>
          </Avatar>
          <span className="ml-2">{currentTeam.name}</span>
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {teams.map((team) => (
          <DropdownMenuItem key={team.id} asChild>
            <Link to={`/team/${team.program}/${team.number}`}>{team.name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Auth-Aware Pages (GitHub-Style Behavior)

**CRITICAL:** Public pages must check auth state and redirect authenticated users.

### Marketing Page (`/`)

```tsx
import { useSession } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function LandingPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  // Redirect authenticated users to dashboard (GitHub-style behavior)
  useEffect(() => {
    if (!isPending && session?.user) {
      navigate({ to: "/dashboard" });
    }
  }, [session, isPending, navigate]);

  // Show nothing while checking auth to avoid flash
  if (isPending) {
    return null;
  }

  return (/* marketing content */);
}
```

### Login Page (`/login`)

```tsx
function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { data: session, isPending } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isPending && session?.user) {
      navigate({ to: redirect || "/dashboard" });
    }
  }, [session, isPending, navigate, redirect]);

  // Show nothing while checking auth to avoid flash
  if (isPending) {
    return null;
  }

  return (/* login form */);
}
```

### OAuth Callback Pattern

```tsx
// Always use absolute URL for OAuth callback to return to frontend
const callbackPath = redirect || "/dashboard";
const absoluteCallbackURL = callbackPath.startsWith("http")
  ? callbackPath
  : `${window.location.origin}${callbackPath}`;

await signIn.social({
  provider,
  callbackURL: absoluteCallbackURL, // e.g., http://localhost:5173/dashboard
});
```

**Why this matters:**

- Frontend is at localhost:5173, API at localhost:3000 (in dev)
- OAuth flow: Frontend → API → Provider → API callback → redirect to callbackURL
- Relative URLs resolve from API server origin, breaking the redirect
- Always use `window.location.origin` for absolute callback URLs

## Anti-Patterns

- **Hardcoded paths** - Always build from `teamPath` + relative path
- **Missing route regeneration** - Run dev server after adding routes
- **Inline nav items** - Keep nav items in arrays at top of file
- **No active state** - Every nav item needs active state detection
- **Forgetting breadcrumbs** - Update segment labels when adding routes
- **No auth check on public pages** - Marketing/login must redirect authenticated users
- **Relative OAuth callbacks** - Always use absolute URLs with `window.location.origin`
- **Flash of unauthenticated content** - Return `null` while `isPending` is true

## Reference Files

- `src/components/layout/app-sidebar.tsx` - Main sidebar
- `src/components/layout/app-header.tsx` - Header with breadcrumbs
- `src/routeTree.gen.ts` - Auto-generated route tree
- `docs/ui-refocus-spec.md` - Navigation requirements
