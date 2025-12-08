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
import Websites from "./pages/Websites";
import PagesPage from "./pages/PagesPage";
import Rankings from "./pages/Rankings";
import Backlinks from "./pages/Backlinks";
import LocalSEO from "./pages/LocalSEO";
import Automation from "./pages/Automation";
import Chat from "./pages/Chat";
import Team from "./pages/Team";
import { AuthGate } from "./components/AuthGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/starred" element={<Starred />} />
            <Route path="/recent" element={<Recent />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/pages" element={<PagesPage />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/keywords" element={<Keywords />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/backlinks" element={<Backlinks />} />
            <Route path="/local-seo" element={<LocalSEO />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
