import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

const starredItems = [
  { title: "TechStartup Pro", type: "Project", description: "High-priority SaaS account" },
  { title: "Ecommerce Giant", type: "Project", description: "Weekly audit in progress" },
  { title: "Local SEO - Restaurants", type: "Board", description: "Tasks and rankings grouped" },
];

export default function Starred() {
  return (
    <MainLayout>
      <Header title="Starred" subtitle="Your pinned projects, boards, and reports" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {starredItems.map((item) => (
          <Card
            key={item.title}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <CardTitle>{item.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{item.type}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

