import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import StudentsPage from "@/pages/students-page";
import StudentDetailPage from "@/pages/student-detail-page";
import FinancePage from "@/pages/finance-page";
import BudgetPage from "@/pages/budget-page";
import ExpensesPage from "@/pages/expenses-page";
import ReportsPage from "@/pages/reports-page";
import CategoriesPage from "@/pages/categories-page";
import ContributionsPage from "@/pages/contributions-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/students" component={StudentsPage} />
      <ProtectedRoute path="/students/:id" component={StudentDetailPage} />
      <ProtectedRoute path="/finances" component={FinancePage} />
      <ProtectedRoute 
        path="/budget" 
        component={BudgetPage} 
        allowedRoles={["superadmin", "section_admin"]} 
      />
      <ProtectedRoute 
        path="/expenses" 
        component={ExpensesPage} 
        allowedRoles={["superadmin", "section_admin"]} 
      />
      <ProtectedRoute 
        path="/reports" 
        component={ReportsPage} 
        allowedRoles={["superadmin", "section_admin"]} 
      />
      <ProtectedRoute 
        path="/contributions" 
        component={ContributionsPage} 
      />
      <ProtectedRoute 
        path="/categories" 
        component={CategoriesPage} 
        allowedRoles={["superadmin"]} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
