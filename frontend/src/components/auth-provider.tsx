import { createContext, useContext, ReactNode } from "react";
import { useSession, signOut, type Session } from "@/lib/auth";

interface AuthContextValue {
  session: Session | null;
  user: Session["user"] | null;
  isPending: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        session: session ?? null,
        user: session?.user ?? null,
        isPending,
        isAuthenticated: !!session,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
