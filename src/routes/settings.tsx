import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle,
  Link2,
  Link2Off,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Discord icon component
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    discord_link_token: (search.discord_link_token as string) || undefined,
    error: (search.error as string) || undefined,
  }),
});

function SettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { discord_link_token, error } = useSearch({ from: "/settings" });

  const user = useQuery(api.users.getUser);
  const discordLink = useQuery(api.discord.links.getMyDiscordLink);
  const completeLinkAccount = useMutation(
    api.discord.linkAccount.completeLinkAccount
  );
  const unlinkDiscord = useMutation(api.discord.links.unlinkDiscord);
  const updateBirthdate = useMutation(api.users.updateBirthdate);

  const [linkStatus, setLinkStatus] = useState<
    "idle" | "linking" | "success" | "error"
  >("idle");
  const [linkError, setLinkError] = useState<string>("");
  const [linkedUsername, setLinkedUsername] = useState<string>("");

  // Birthdate editing state
  const [birthdateInput, setBirthdateInput] = useState<string>("");
  const [birthdateSaving, setBirthdateSaving] = useState(false);
  const [birthdateError, setBirthdateError] = useState<string>("");
  const [birthdateSuccess, setBirthdateSuccess] = useState(false);

  // Initialize birthdate input when user data loads
  useEffect(() => {
    if (user?.birthdate && !birthdateInput) {
      const date = new Date(user.birthdate);
      setBirthdateInput(date.toISOString().split("T")[0]);
    }
  }, [user?.birthdate, birthdateInput]);

  // Handle Discord link token from OAuth callback
  useEffect(() => {
    if (!discord_link_token || linkStatus !== "idle") return;

    const completeLink = async () => {
      setLinkStatus("linking");
      try {
        const result = await completeLinkAccount({ token: discord_link_token });
        setLinkStatus("success");
        setLinkedUsername(result.discordUsername || "");
        // Clear the token from URL
        navigate({
          to: "/settings",
          search: { discord_link_token: undefined, error: undefined },
          replace: true,
        });
      } catch (err) {
        setLinkStatus("error");
        setLinkError(
          err instanceof Error ? err.message : "Failed to link Discord account"
        );
        navigate({
          to: "/settings",
          search: { discord_link_token: undefined, error: undefined },
          replace: true,
        });
      }
    };

    completeLink();
  }, [discord_link_token, linkStatus, completeLinkAccount, navigate]);

  // Handle error from OAuth
  useEffect(() => {
    if (error) {
      setLinkStatus("error");
      switch (error) {
        case "discord_denied":
          setLinkError("Discord authorization was denied.");
          break;
        case "token_exchange":
          setLinkError("Failed to exchange Discord authorization code.");
          break;
        case "user_info":
          setLinkError("Failed to get Discord user information.");
          break;
        default:
          setLinkError("An error occurred during Discord linking.");
      }
      navigate({
        to: "/settings",
        search: { discord_link_token: undefined, error: undefined },
        replace: true,
      });
    }
  }, [error, navigate]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLinkDiscord = () => {
    // Redirect to our HTTP action that initiates Discord OAuth
    window.location.href = `${import.meta.env.VITE_CONVEX_URL?.replace(".cloud", ".site") || ""}/discord/link`;
  };

  const handleUnlinkDiscord = async () => {
    if (confirm("Are you sure you want to unlink your Discord account?")) {
      await unlinkDiscord({});
    }
  };

  const handleSaveBirthdate = async () => {
    if (!birthdateInput) {
      setBirthdateError("Birthdate is required");
      return;
    }

    setBirthdateSaving(true);
    setBirthdateError("");
    setBirthdateSuccess(false);

    try {
      const timestamp = new Date(birthdateInput).getTime();
      await updateBirthdate({ birthdate: timestamp });
      setBirthdateSuccess(true);
      setTimeout(() => setBirthdateSuccess(false), 3000);
    } catch (err) {
      setBirthdateError(
        err instanceof Error ? err.message : "Failed to save birthdate"
      );
    } finally {
      setBirthdateSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and connected services
          </p>
        </div>

        {/* Success/Error Messages */}
        {linkStatus === "success" && (
          <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Discord account linked successfully!
                  </p>
                  {linkedUsername && (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Linked to: {linkedUsername}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {linkStatus === "error" && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    Failed to link Discord
                  </p>
                  <p className="text-sm text-destructive/80">{linkError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <p className="font-medium">{user?.name || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{user?.email || "Not set"}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Birthdate Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Birthdate
            </CardTitle>
            <CardDescription>
              Required for youth protection compliance. Your age helps us ensure
              appropriate interactions and verify mentor eligibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user === undefined ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date of Birth</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={birthdateInput}
                    onChange={(e) => {
                      setBirthdateInput(e.target.value);
                      setBirthdateError("");
                    }}
                    max={new Date().toISOString().split("T")[0]}
                    required
                  />
                  {birthdateError && (
                    <p className="text-sm text-destructive">{birthdateError}</p>
                  )}
                  {birthdateSuccess && (
                    <p className="text-sm text-green-600">
                      Birthdate saved successfully!
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSaveBirthdate}
                  disabled={birthdateSaving || !birthdateInput}
                >
                  {birthdateSaving ? "Saving..." : "Save Birthdate"}
                </Button>
                {user && !user.birthdate && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Please set your birthdate to complete your profile.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discord Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DiscordIcon className="h-5 w-5" />
              Discord Integration
            </CardTitle>
            <CardDescription>
              Link your Discord account to use GLaDOS (our team assistant) in
              your team's Discord server
            </CardDescription>
          </CardHeader>
          <CardContent>
            {discordLink === undefined ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24 mt-1" />
                </div>
              </div>
            ) : discordLink ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                      <DiscordIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {discordLink.discordUsername ||
                            `User ${discordLink.discordUserId.slice(0, 8)}`}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          <Link2 className="h-3 w-3 mr-1" />
                          Linked
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        via{" "}
                        {discordLink.linkedVia === "oauth"
                          ? "Discord Login"
                          : "Manual Link"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkDiscord}
                    className="text-destructive hover:text-destructive"
                  >
                    <Link2Off className="h-4 w-4 mr-2" />
                    Unlink
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your Discord account is linked. GLaDOS can now identify you in
                  your team's Discord server.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your Discord account to let GLaDOS recognize you in
                  your team's server. This enables personalized assistance based
                  on your team membership.
                </p>
                <Button
                  onClick={handleLinkDiscord}
                  disabled={linkStatus === "linking"}
                  className="bg-[#5865F2] hover:bg-[#4752C4]"
                >
                  <DiscordIcon className="h-5 w-5 mr-2" />
                  {linkStatus === "linking"
                    ? "Linking..."
                    : "Link Discord Account"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
