import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  FileText,
  Target,
  TrendingUp,
  Link2,
  MapPin,
  ListTodo,
  BarChart3,
  Settings,
  MessageSquare,
  Users,
  Zap,
  ChevronDown,
  Star,
  Clock,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Quick Access",
    items: [
      { title: "Starred", href: "/starred", icon: Star },
      { title: "Recent", href: "/recent", icon: Clock },
    ],
  },
  {
    title: "SEO Modules",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Projects", href: "/projects", icon: FolderKanban, badge: 12 },
      { title: "Websites", href: "/websites", icon: Globe },
      { title: "Pages", href: "/pages", icon: FileText },
      { title: "Keywords", href: "/keywords", icon: Target, badge: 248 },
      { title: "Rankings", href: "/rankings", icon: TrendingUp },
      { title: "Backlinks", href: "/backlinks", icon: Link2 },
      { title: "Local SEO", href: "/local-seo", icon: MapPin },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Tasks", href: "/tasks", icon: ListTodo, badge: 23 },
      { title: "Automation", href: "/automation", icon: Zap },
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Team Chat", href: "/chat", icon: MessageSquare, badge: 5 },
      { title: "Team", href: "/team", icon: Users },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["SEO Modules", "Operations"]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-panel rounded-3xl z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-foreground">SEO CRM</h1>
                <p className="text-xs text-muted-foreground">Operations Hub</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-sm">
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                {section.title}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    expandedSections.includes(section.title) && "rotate-180"
                  )}
                />
              </button>
            )}
            {(collapsed || expandedSections.includes(section.title)) && (
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "sidebar-item",
                      collapsed && "justify-center px-2"
                    )}
                    activeClassName="active"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <NavLink
          to="/settings"
          className={cn("sidebar-item", collapsed && "justify-center px-2")}
          activeClassName="active"
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        
        {!collapsed && (
          <div className="mt-3 p-3 rounded-xl bg-muted/50 flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">SEO Lead</p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
