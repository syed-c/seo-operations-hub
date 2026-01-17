import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Search, 
  Filter, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Calendar,
  User,
  Folder
} from 'lucide-react';
import { useBacklinkReports, BacklinkReportFilters } from '@/hooks/useBacklinkReports';
import { BacklinkReportStatus } from '@/types';
import { cn } from '@/lib/utils';
import { BacklinkReportDetailModal } from './BacklinkReportDetailModal';

const statusConfig: Record<BacklinkReportStatus, { icon: typeof AlertCircle; color: string; bgColor: string; label: string }> = {
  critical: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Warning',
  },
  healthy: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Healthy',
  },
};

interface BacklinkReportsListProps {
  projectId?: string;
  assigneeId?: string;
}

export function BacklinkReportsList({ projectId, assigneeId }: BacklinkReportsListProps) {
  const [filters, setFilters] = useState<BacklinkReportFilters>({
    projectId,
    assigneeId,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: reports, isLoading, error } = useBacklinkReports(filters);

  const filteredReports = reports?.filter(report => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      report.tasks?.title?.toLowerCase().includes(searchLower) ||
      report.projects?.name?.toLowerCase().includes(searchLower) ||
      report.users?.email?.toLowerCase().includes(searchLower) ||
      report.users?.first_name?.toLowerCase().includes(searchLower) ||
      report.users?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsModalOpen(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Error loading reports: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              status: value === 'all' ? undefined : value as BacklinkReportStatus 
            }))}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
            className="w-[150px]"
          />

          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
            className="w-[150px]"
          />

          {(filters.status || filters.startDate || filters.endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ projectId, assigneeId })}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReports?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Reports Found</h3>
              <p className="text-muted-foreground">
                No backlink reports match your current filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReports?.map((report, index) => {
              const status = statusConfig[report.status];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={report.id}
                  className="hover:shadow-card-hover transition-all cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleViewReport(report.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', status.bgColor)}>
                        <StatusIcon className={cn('w-6 h-6', status.color)} />
                      </div>

                      {/* Report Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {report.tasks?.title || 'Backlink Report'}
                          </h3>
                          <Badge className={cn('text-xs', status.bgColor, status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {report.projects?.name || 'Unknown Project'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {report.users?.first_name && report.users?.last_name
                              ? `${report.users.first_name} ${report.users.last_name}`
                              : report.users?.email || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Summary Stats from actual DB columns */}
                      <div className="hidden md:flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{report.total_links_checked || 0}</p>
                          <p className="text-xs text-muted-foreground">Links</p>
                        </div>
                        <div className="text-center">
                          <p className={cn('font-semibold', (report.total_dead || 0) > 0 && 'text-destructive')}>
                            {report.total_dead || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Dead</p>
                        </div>
                        <div className="text-center">
                          <p className={cn('font-semibold', report.health_percentage < 80 ? 'text-warning' : 'text-success')}>
                            {report.health_percentage || 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Health</p>
                        </div>
                      </div>

                      {/* View Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewReport(report.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      <BacklinkReportDetailModal
        reportId={selectedReportId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReportId(null);
        }}
      />
    </>
  );
}
