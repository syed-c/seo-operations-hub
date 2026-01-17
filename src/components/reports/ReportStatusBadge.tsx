import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { BacklinkReportStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<BacklinkReportStatus, { icon: typeof AlertCircle; color: string; bgColor: string; label: string }> = {
  critical: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    label: 'Warning',
  },
  healthy: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    label: 'Healthy',
  },
};

interface ReportStatusBadgeProps {
  status: BacklinkReportStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function ReportStatusBadge({ status, size = 'md', showIcon = true }: ReportStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.bgColor,
        config.color,
        sizeClasses[size],
        showIcon && 'gap-1'
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
