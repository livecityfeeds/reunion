import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type RoleType = "superadmin" | "section_admin" | "student" | undefined;

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: RoleType[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if the user's role is allowed to access this route
  if (allowedRoles && !allowedRoles.includes(user.role as RoleType)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen flex-col">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <a href="/" className="text-blue-600 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
