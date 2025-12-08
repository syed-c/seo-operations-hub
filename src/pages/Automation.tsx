import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Play, Pause } from "lucide-react";

const rules = [
  { name: "Daily ranking sync", status: "Active", trigger: "07:00 UTC", action: "Update SERP data" },
  { name: "Weekly audit", status: "Active", trigger: "Mon 08:00", action: "Run full audit + report" },
  { name: "Toxic backlink alert", status: "Paused", trigger: "On link added", action: "Create disavow task" },
];

export default function Automation() {
  return (
    <MainLayout>
      <Header title="Automation" subtitle="Rule-based workflows for audits, rankings, and tasks" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <Card
            key={rule.name}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <CardTitle>{rule.name}</CardTitle>
              </div>
              <span className={`chip ${rule.status === "Active" ? "chip-success" : "chip-warning"}`}>
                {rule.status}
              </span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                {rule.status === "Active" ? <Play className="w-4 h-4 text-success" /> : <Pause className="w-4 h-4 text-warning" />}
                Trigger: {rule.trigger}
              </div>
              <p>Action: {rule.action}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

