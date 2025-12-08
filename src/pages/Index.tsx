import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { RankingChart } from "@/components/dashboard/RankingChart";
import { TaskList } from "@/components/dashboard/TaskList";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { QuickStats } from "@/components/dashboard/QuickStats";
import {
  MousePointerClick,
  Eye,
  TrendingUp,
  Wrench,
  FileText,
  Link2,
  MapPin,
  AlertCircle,
} from "lucide-react";

const kpiData = [
  {
    title: "Total Clicks",
    value: "48.2K",
    change: 12.5,
    changeLabel: "vs last week",
    icon: MousePointerClick,
  },
  {
    title: "Impressions",
    value: "1.2M",
    change: 8.3,
    changeLabel: "vs last week",
    icon: Eye,
  },
  {
    title: "Avg. Position",
    value: "4.2",
    change: 15.2,
    changeLabel: "improved",
    icon: TrendingUp,
  },
  {
    title: "Technical Score",
    value: "87%",
    change: 3.1,
    changeLabel: "vs last audit",
    icon: Wrench,
  },
  {
    title: "Content Score",
    value: "72%",
    change: -2.4,
    changeLabel: "needs work",
    icon: FileText,
  },
  {
    title: "Backlinks",
    value: "2,847",
    change: 5.7,
    changeLabel: "new this month",
    icon: Link2,
  },
  {
    title: "Local SEO Score",
    value: "91%",
    change: 1.2,
    changeLabel: "stable",
    icon: MapPin,
  },
  {
    title: "Issues Found",
    value: "23",
    change: -18.5,
    changeLabel: "reduced",
    icon: AlertCircle,
  },
];

const Index = () => {
  return (
    <MainLayout>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's your SEO performance overview."
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            icon={kpi.icon}
            delay={index * 50}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Charts & Tasks */}
        <div className="col-span-8 space-y-6">
          <RankingChart />
          <TaskList />
        </div>

        {/* Right Column - AI & Stats */}
        <div className="col-span-4 space-y-6">
          <AIInsights />
          <QuickStats />
        </div>
      </div>

      {/* Projects Overview */}
      <div className="mt-6">
        <ProjectsOverview />
      </div>
    </MainLayout>
  );
};

export default Index;
