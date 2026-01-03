import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthGate";

const threads = [
  { title: "Project: TechStartup Pro", last: "Ranking uplift summary", unread: 3 },
  { title: "Content squad", last: "Draft briefs for Q2", unread: 0 },
  { title: "AI Assistant", last: "Suggested tasks for backlink drops", unread: 1 },
];

export default function Chat() {
  const { teamUser } = useAuth();
  
  // Determine if user has permission to access chat
  const canAccessChat = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead' || teamUser?.role === 'Content Lead' || teamUser?.role === 'Backlink Lead' || teamUser?.role === 'Technical SEO' || teamUser?.role === 'Developer';
  
  return (
    <MainLayout>
      <Header title="Team Chat" subtitle="Project rooms, squads, and AI assistant" />
      {canAccessChat ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {threads.map((thread) => (
          <Card
            key={thread.title}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">{thread.title}</CardTitle>
              </div>
              {thread.unread > 0 && (
                <span className="chip chip-primary">{thread.unread} new</span>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">{thread.last}</span>
              {thread.title === "AI Assistant" && <Sparkles className="w-4 h-4 text-warning" />}
            </CardContent>
          </Card>
        ))}
      </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have permission to access this feature.</p>
        </div>
      )}
    </MainLayout>
  );
}

