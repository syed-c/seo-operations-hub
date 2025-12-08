import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { User, Bell, Shield, Palette, Globe, Key, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    id: "profile",
    title: "Profile Settings",
    icon: User,
    description: "Manage your personal information and preferences",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    description: "Configure how and when you receive alerts",
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    description: "Password, 2FA, and session management",
  },
  {
    id: "appearance",
    title: "Appearance",
    icon: Palette,
    description: "Theme, colors, and display preferences",
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: Globe,
    description: "Connect external services and APIs",
  },
  {
    id: "api-keys",
    title: "API Keys",
    icon: Key,
    description: "Manage API keys for external access",
  },
  {
    id: "data",
    title: "Data & Storage",
    icon: Database,
    description: "Export, import, and manage your data",
  },
  {
    id: "automation",
    title: "Automation Rules",
    icon: Zap,
    description: "Configure automated workflows and triggers",
  },
];

export default function Settings() {
  return (
    <MainLayout>
      <Header title="Settings" subtitle="Manage your account and application preferences" />

      <div className="grid grid-cols-12 gap-6">
        {/* Settings Navigation */}
        <div className="col-span-4">
          <div className="glass-card p-4 animate-slide-up">
            <nav className="space-y-1">
              {settingsSections.map((section, index) => (
                <button
                  key={section.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-muted",
                    index === 0 && "bg-primary/10 text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      index === 0 ? "bg-primary/20" : "bg-muted"
                    )}
                  >
                    <section.icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{section.description}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-span-8 space-y-6">
          {/* Profile Section */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "50ms" }}>
            <h3 className="font-semibold mb-6">Profile Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">First Name</label>
                  <input
                    type="text"
                    defaultValue="John"
                    className="w-full h-10 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last Name</label>
                  <input
                    type="text"
                    defaultValue="Doe"
                    className="w-full h-10 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <input
                  type="email"
                  defaultValue="john.doe@company.com"
                  className="w-full h-10 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <input
                  type="text"
                  defaultValue="SEO Lead"
                  disabled
                  className="w-full h-10 px-4 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <h3 className="font-semibold mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { label: "Ranking changes", description: "Get notified when rankings change significantly" },
                { label: "Daily reports", description: "Receive daily SEO performance summaries" },
                { label: "Task assignments", description: "Notifications when tasks are assigned to you" },
                { label: "Audit completions", description: "Get notified when audits finish running" },
                { label: "Team mentions", description: "Notifications when someone mentions you" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={index < 3} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl">Cancel</Button>
            <Button className="rounded-xl">Save Changes</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
