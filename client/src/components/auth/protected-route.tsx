import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute:', { isLoading, hasUser: !!user });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to /auth');
    return <Redirect to="/auth" />;
  }

  console.log('Rendering protected content');
  return <>{children}</>;
}