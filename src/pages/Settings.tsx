import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { User, Bell, Shield, Palette, Globe, Key, Database, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Define the form schema with Zod
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

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
  const [activeSection, setActiveSection] = useState("profile");
  const navigate = useNavigate();

  // Initialize the form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@company.com",
      role: "SEO Lead",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    console.log("Form submitted:", data);
    // Here you would typically send the data to your backend
  }

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
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-muted",
                    activeSection === section.id && "bg-primary/10 text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      activeSection === section.id ? "bg-primary/20" : "bg-muted"
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormDescription>Your role in the organization</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Save Changes</Button>
              </form>
            </Form>
          </div>

          {/* Notification Preferences */}
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">Configure how and when you receive alerts</p>
              </div>
              <Button 
                variant="outline" 
                className="rounded-xl gap-2"
                onClick={() => navigate('/notification-settings')}
              >
                Advanced Settings
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
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
            <Button className="rounded-xl">Save All Changes</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}