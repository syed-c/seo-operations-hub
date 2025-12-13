import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Keywords from "./pages/Keywords";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Starred from "./pages/Starred";
import Recent from "./pages/Recent";
import PagesPage from "./pages/PagesPage";
import Rankings from "./pages/Rankings";
import Backlinks from "./pages/Backlinks";
import LocalSEO from "./pages/LocalSEO";
import Automation from "./pages/Automation";
import Chat from "./pages/Chat";
import Team from "./pages/Team";
import RoleBasedDashboard from "./components/dashboard/RoleBasedDashboard";
import NotificationSettings from "./pages/NotificationSettings";
import ProjectSelection from "./pages/ProjectSelection";
import SEOLeadDashboard from "./pages/roles/SEOLeadDashboard";
import ContentLeadDashboard from "./pages/roles/ContentLeadDashboard";
import BacklinkLeadDashboard from "./pages/roles/BacklinkLeadDashboard";
import DeveloperDashboard from "./pages/roles/DeveloperDashboard";
import ClientDashboard from "./pages/roles/ClientDashboard";
import AuthCallback from "./pages/AuthCallback";
import { AuthGate } from "./components/AuthGate";
import { ProjectProvider } from "./contexts/ProjectContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGate>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/project-selection" element={<ProjectSelection />} />
              <Route path="/dashboard" element={<RoleBasedDashboard userRole="Super Admin" />} />
              <Route path="/seo-lead-dashboard" element={<SEOLeadDashboard />} />
              <Route path="/content-lead-dashboard" element={<ContentLeadDashboard />} />
              <Route path="/backlink-lead-dashboard" element={<BacklinkLeadDashboard />} />
              <Route path="/developer-dashboard" element={<DeveloperDashboard />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/starred" element={<Starred />} />
              <Route path="/recent" element={<Recent />} />
              <Route path="/projects" element={<Projects />} />
              {/* Removed separate websites route since websites are now projects */}
              <Route path="/pages" element={<PagesPage />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/keywords" element={<Keywords />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/backlinks" element={<Backlinks />} />
              <Route path="/local-seo" element={<LocalSEO />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/team" element={<Team />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notification-settings" element={<NotificationSettings />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </AuthGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;