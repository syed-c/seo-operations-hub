import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

const recentItems = [
  { title: "Ranking audit - Dubai", meta: "Ran 2 hours ago" },
  { title: "Content brief - /blog/ai-seo", meta: "Edited 5 hours ago" },
  { title: "Backlink review - SaaS Platform", meta: "Yesterday" },
];

export default function Recent() {
  return (
    <MainLayout>
      <Header title="Recent" subtitle="Latest boards, reports, and audits you opened" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentItems.map((item) => (
          <Card
            key={item.title}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <CardTitle>{item.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{item.meta}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Quickly resume where you left off.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

