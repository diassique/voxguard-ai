// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE TYPES - TypeScript Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type RuleCategory =
  | 'prohibited_language'
  | 'insider_trading'
  | 'market_manipulation'
  | 'pii_disclosure'
  | 'pci_violation'
  | 'phi_violation'
  | 'pressure_sales'
  | 'unsuitable_advice'
  | 'unauthorized_promise'
  | 'conflict_of_interest'
  | 'off_channel'
  | 'profanity'
  | 'discrimination'
  | 'threat'
  | 'fraud_indicator';

export type JurisdictionType = 'US' | 'EU' | 'UK' | 'GLOBAL' | 'US_EU' | 'APAC';

export type ActionType =
  | 'alert_only'
  | 'warn_agent'
  | 'notify_supervisor'
  | 'pause_recording'
  | 'escalate_compliance'
  | 'stop_call'
  | 'immediate_review'
  | 'auto_flag';

export interface ComplianceRule {
  // Primary Identification
  id: string;
  rule_code: string;
  version: number;

  // Rule Metadata
  name: string;
  description: string | null;
  category: RuleCategory;

  // Severity & Risk Scoring
  severity: SeverityLevel;
  risk_score: number;
  base_weight: number;
  repeat_multiplier: number;

  // Detection Patterns
  patterns: string[];
  keywords: string[];
  exclude_patterns: string[] | null;
  context_required: string[] | null;
  elevenlabs_keyterms: string[] | null;

  // Regulatory Information
  jurisdiction: JurisdictionType;
  regulation_code: string | null;
  regulation_name: string | null;
  regulation_url: string | null;
  related_regulations: string[] | null;

  // Actions & Responses
  primary_action: ActionType;
  secondary_action: ActionType | null;
  alert_title: string | null;
  alert_message: string | null;
  supervisor_message: string | null;
  suggested_phrases: string[] | null;

  // Targeting & Conditions
  applies_to_roles: string[];
  applies_to_departments: string[] | null;
  applies_to_products: string[] | null;
  active_hours: any | null;

  // Thresholds & Limits
  confidence_threshold: number;
  cooldown_seconds: number;
  max_alerts_per_session: number;
  min_text_length: number;

  // Entity Detection
  trigger_on_entities: string[] | null;
  auto_redact_entities: boolean;

  // Audit & Compliance
  requires_acknowledgment: boolean;
  requires_documentation: boolean;
  retention_period_days: number;

  // Analytics & ML
  total_triggers: number;
  false_positive_count: number;
  false_positive_rate: number | null;
  last_triggered_at: string | null;
  ml_model_id: string | null;
  ml_threshold: number | null;

  // Status & Lifecycle
  is_active: boolean;
  is_beta: boolean;
  effective_from: string;
  effective_until: string | null;

  // Metadata
  tags: string[] | null;
  notes: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RulesByCategory {
  category: RuleCategory;
  severity: SeverityLevel;
  rule_count: number;
  avg_risk_score: number;
  rule_codes: string[];
}

export interface RulesStats {
  total_rules: number;
  active_rules: number;
  critical_rules: number;
  high_rules: number;
  medium_rules: number;
  low_rules: number;
  categories: number;
  jurisdictions: number;
}

export interface ComplianceAlert {
  id: string;
  rule_id: string;
  rule_code: string;
  recording_id: string;
  user_id: string;

  // Alert Details
  severity: SeverityLevel;
  category: RuleCategory;
  matched_pattern: string;
  matched_text: string;
  confidence_score: number;

  // Context
  timestamp: string;
  transcript_segment: string;
  speaker_role: string;

  // Status
  status: 'pending' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolution_notes: string | null;

  created_at: string;
}

// Helper functions
export const getSeverityColor = (severity: SeverityLevel): string => {
  const colors = {
    critical: '#dc2626', // red-600
    high: '#ea580c', // orange-600
    medium: '#f59e0b', // amber-500
    low: '#3b82f6', // blue-500
  };
  return colors[severity];
};

export const getSeverityBadgeClass = (severity: SeverityLevel): string => {
  const classes = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return classes[severity];
};

export const getCategoryLabel = (category: RuleCategory): string => {
  const labels: Record<RuleCategory, string> = {
    prohibited_language: 'Prohibited Language',
    insider_trading: 'Insider Trading',
    market_manipulation: 'Market Manipulation',
    pii_disclosure: 'PII Disclosure',
    pci_violation: 'PCI Violation',
    phi_violation: 'PHI Violation',
    pressure_sales: 'Pressure Sales',
    unsuitable_advice: 'Unsuitable Advice',
    unauthorized_promise: 'Unauthorized Promise',
    conflict_of_interest: 'Conflict of Interest',
    off_channel: 'Off-Channel Communication',
    profanity: 'Profanity',
    discrimination: 'Discrimination',
    threat: 'Threats',
    fraud_indicator: 'Fraud Indicator',
  };
  return labels[category];
};

export const getJurisdictionLabel = (jurisdiction: JurisdictionType): string => {
  const labels: Record<JurisdictionType, string> = {
    US: 'United States',
    EU: 'European Union',
    UK: 'United Kingdom',
    GLOBAL: 'Global',
    US_EU: 'US & EU',
    APAC: 'Asia-Pacific',
  };
  return labels[jurisdiction];
};
