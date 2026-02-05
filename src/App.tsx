import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Analytics from "@/pages/Analytics";
import Valutazioni from "@/pages/Valutazioni";
import { CommandDialogDemo } from "@/components/commandDialog";
import Exercises from "@/pages/Exercises";
import LoginPage from "@/pages/LoginPage";
import Settings from "@/pages/Settings";
import WelcomePage from "@/pages/WelcomePage";


// Layout wrapper for authenticated pages (with sidebar and command dialog)
// Layout wrapper for authenticated pages (with sidebar and command dialog)
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import ScrollToTop from "@/components/ScrollToTop";
import { useAuth, useClient } from "./provider/clientProvider";
import { useEffect } from "react";
import { OnboardingTour } from "@/components/OnboardingTour";
import { EasterEgg } from "@/components/EasterEgg";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center">
        <div className="flex items-center font-bold gap-2 self-center text-7xl animate-pulse">
          SportsGradeHub
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <CommandDialogDemo />
        <OnboardingTour />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {

  const client = useClient();

  useEffect(() => {
    const checkAuth = async () => {

      await client.isAuthenticated();

    };
    checkAuth();
  }, []);


  return (
    <Router>
      <ScrollToTop />
      <EasterEgg />
      <Routes>
        {/* Login page - standalone without sidebar */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated routes */}
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/dashboard" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
        <Route path="/exercises" element={<AuthenticatedLayout><Exercises /></AuthenticatedLayout>} />
        <Route path="/valutazioni" element={<Navigate to="/valutazioni/all/all" replace />} />
        <Route path="/valutazioni/:classId/:exerciseId" element={<AuthenticatedLayout><Valutazioni /></AuthenticatedLayout>} />
        <Route path="/classes/:id" element={<AuthenticatedLayout><Classes /></AuthenticatedLayout>} />
        <Route path="/students" element={<AuthenticatedLayout><Students /></AuthenticatedLayout>} />
        <Route path="/students/:id" element={<AuthenticatedLayout><StudentDetail /></AuthenticatedLayout>} />
        <Route path="/analytics" element={<AuthenticatedLayout><Analytics /></AuthenticatedLayout>} />
        <Route path="/settings" element={<AuthenticatedLayout><Settings /></AuthenticatedLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
