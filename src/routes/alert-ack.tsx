import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
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
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/alert-ack")({
  component: AlertAckPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

function AlertAckPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/alert-ack" });
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const tokenValidation = useQuery(
    api.safetyAlerts.getByAckToken,
    token ? { token } : "skip"
  );

  const acknowledgeByToken = useMutation(api.safetyAlerts.acknowledgeByToken);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No token provided");
      return;
    }

    if (tokenValidation === undefined) {
      // Still loading
      return;
    }

    if (tokenValidation.error) {
      setStatus("error");
      switch (tokenValidation.error) {
        case "invalid_token":
          setErrorMessage("This link is invalid or has already been used.");
          break;
        case "expired_token":
          setErrorMessage(
            "This link has expired. Please check for a more recent notification."
          );
          break;
        case "already_used":
          setErrorMessage("This alert has already been acknowledged.");
          break;
        case "alert_not_found":
          setErrorMessage("The associated alert could not be found.");
          break;
        default:
          setErrorMessage("An unknown error occurred.");
      }
      return;
    }

    // Token is valid - acknowledge it
    const acknowledge = async () => {
      try {
        const result = await acknowledgeByToken({ token });
        setStatus("success");
        // Redirect to safety dashboard after a short delay
        setTimeout(() => {
          navigate({
            to: "/team/$teamId/safety",
            params: { teamId: result.teamId },
          });
        }, 2000);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to acknowledge alert"
        );
      }
    };

    acknowledge();
  }, [token, tokenValidation, acknowledgeByToken, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4">
                <Clock className="h-12 w-12 text-muted-foreground animate-pulse" />
              </div>
              <CardTitle>Acknowledging Alert</CardTitle>
              <CardDescription>
                Please wait while we process your acknowledgment...
              </CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>Alert Acknowledged</CardTitle>
              <CardDescription>
                Thank you for reviewing this safety alert. Redirecting to the
                safety dashboard...
              </CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Unable to Process</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {status === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      Need to review safety alerts?
                    </p>
                    <p className="mt-1 text-orange-700 dark:text-orange-300">
                      Log in to your BuildSeason account and visit the Safety
                      Dashboard for your team.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: "/login" })}
              >
                Go to Login
              </Button>
            </div>
          )}
          {status === "success" && (
            <div className="text-center text-sm text-muted-foreground">
              <p>If you're not redirected automatically,</p>
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  if (tokenValidation?.teamId) {
                    navigate({
                      to: "/team/$teamId/safety",
                      params: { teamId: tokenValidation.teamId },
                    });
                  }
                }}
              >
                click here to continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
