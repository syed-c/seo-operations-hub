import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Link,
  ExternalLink,
  Calendar,
  ShieldAlert,
  TrendingUp,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BacklinkDetailModalProps {
  backlink: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BacklinkDetailModal({ backlink, isOpen, onClose }: BacklinkDetailModalProps) {
  if (!isOpen || !backlink) return null;

  const getStatusConfig = () => {
    switch (backlink.link_status) {
      case 'working':
        return {
          icon: CheckCircle,
          color: 'text-success',
          bgColor: 'bg-success/10',
          label: 'Working',
          borderColor: 'border-success'
        };
      case 'dead':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: 'Dead',
          borderColor: 'border-destructive'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          label: 'Pending',
          borderColor: 'border-warning'
        };
      case 'filtered':
        return {
          icon: CheckCircle,
          color: 'text-success',
          bgColor: 'bg-success/10',
          label: 'Filtered',
          borderColor: 'border-success'
        };
      default:
        return {
          icon: Info,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          label: 'Unknown',
          borderColor: 'border-muted'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', statusConfig.bgColor)}>
              <StatusIcon className={cn('w-5 h-5', statusConfig.color)} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">
                Backlink Details
              </DialogTitle>
              <Badge className={cn('mt-1', statusConfig.bgColor, statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Main Link Information */}
            <Card className={cn('border-l-4', statusConfig.borderColor)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Link Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">URL</p>
                  <a
                    href={backlink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline flex items-center gap-1 mt-1"
                  >
                    {backlink.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                {backlink.source_url && backlink.source_url !== backlink.url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Source URL</p>
                    <a
                      href={backlink.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline flex items-center gap-1 mt-1"
                    >
                      {backlink.source_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                
                {backlink.anchor_text && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Anchor Text</p>
                    <p className="text-foreground mt-1">{backlink.anchor_text}</p>
                  </div>
                )}
                
                {backlink.target_url && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target URL</p>
                    <a
                      href={backlink.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline flex items-center gap-1 mt-1"
                    >
                      {backlink.target_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Status Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={cn('mt-1', statusConfig.bgColor, statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Link Type</p>
                    <Badge variant="outline" className="mt-1">
                      {backlink.link_type || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">First Seen</p>
                    <p className="text-foreground mt-1">
                      {new Date(backlink.first_seen_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Checked</p>
                    <p className="text-foreground mt-1">
                      {backlink.last_checked_at 
                        ? new Date(backlink.last_checked_at).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                
                {backlink.submission_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                    <p className="text-foreground mt-1">
                      {new Date(backlink.submission_date).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Metrics */}
            {backlink.toxicity_score !== null && backlink.toxicity_score !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {backlink.toxicity_score > 50 ? (
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-success" />
                    )}
                    Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Toxicity Score</span>
                      <span className={cn('font-semibold',
                        backlink.toxicity_score > 50 ? 'text-destructive' : 'text-success'
                      )}>
                        {backlink.toxicity_score}
                      </span>
                    </div>
                    
                    {backlink.spam_reason && (
                      <div>
                        <p className="text-sm text-muted-foreground">Spam Reason</p>
                        <p className="text-foreground text-sm mt-1">{backlink.spam_reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <Badge 
                      variant={backlink.is_active ? 'default' : 'destructive'} 
                      className="mt-1"
                    >
                      {backlink.is_active ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lost</p>
                    <Badge 
                      variant={backlink.lost ? 'destructive' : 'default'} 
                      className="mt-1"
                    >
                      {backlink.lost ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                
                {backlink.http_status_code && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">HTTP Status</p>
                    <p className="text-foreground mt-1">{backlink.http_status_code}</p>
                  </div>
                )}
                
                {backlink.target_path && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Path</p>
                    <p className="text-foreground mt-1 font-mono text-sm">{backlink.target_path}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Check Result */}
            {backlink.last_check_result && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Check Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(backlink.last_check_result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}