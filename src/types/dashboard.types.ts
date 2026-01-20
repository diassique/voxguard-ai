/**
 * Dashboard Types
 * Types for dashboard statistics and data
 */

export interface DashboardStats {
  totalRecordings: number;
  complianceRate: number;
  totalAlerts: number;
  avgDuration: string;
  trends: {
    recordings: {
      value: string;
      positive: boolean;
    };
    compliance: {
      value: string;
      positive: boolean;
    };
    issues: {
      value: string;
      positive: boolean;
    };
  };
  alerts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
  };
}

export interface RecentRecording {
  id: string;
  name: string;
  duration: string;
  date: string;
  status: string;
  alertCount: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | null;
}

export interface AlertsData {
  alerts: Array<{
    severity: string;
    category: string;
    created_at: string;
    status: string;
  }>;
  bySeverity: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  byCategory: Array<{
    name: string;
    value: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
}
