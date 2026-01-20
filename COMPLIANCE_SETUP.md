# Compliance Rules Engine - Setup Guide

## Overview

This section provides a complete Compliance Rules Engine for monitoring voice recordings for regulatory compliance (SEC, FINRA, GDPR, MiFID II, PCI DSS, HIPAA, etc.).

## Features

- ✅ **19 pre-configured rules** by category:
  - 🚨 Critical (3 rules): Insider Trading, Market Manipulation, Threats
  - ⚠️ High (6 rules): Investment Guarantees, PII/PCI/PHI violations, Fraud indicators
  - ⚡ Medium (6 rules): Pressure sales, Unsuitable advice, Off-channel communication
  - ℹ️ Low (4 rules): Competitor mentions, Complaints, Recording consent

- 📊 **Real-time statistics and analytics**
- 🎯 **Detection by keyword** and regex patterns
- 🌍 **Jurisdiction support**: US, EU, UK, GLOBAL, APAC
- 🔔 **Customizable actions**: from alerts to call termination
- 📈 **Risk scoring** with weights and multipliers
- 🔍 **Integration with ElevenLabs Scribe V2** keyterms

## Installation

### Step 1: Import Schema to Supabase

1. Open your project in [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Create a new query
4. Copy the entire SQL from the schema file (which you provided)
5. Run the query

The schema will create:

- ✅ Table `compliance_rules` with 19 pre-populated rules
- ✅ Views: `v_rules_stats`, `v_rules_by_category`, `v_elevenlabs_keyterms`
- ✅ Functions: `get_elevenlabs_keyterms()`, `get_realtime_rules()`, `increment_rule_trigger()`
- ✅ RLS (Row Level Security) policies

### Step 2: Verify Installation

Run in SQL Editor:

```sql
-- Check rule count
SELECT COUNT(*) FROM compliance_rules;
-- Should return: 19

-- View statistics
SELECT * FROM v_rules_stats;

-- View rules by category
SELECT * FROM v_rules_by_category;

-- Get keyterms for ElevenLabs (max 100)
SELECT get_elevenlabs_keyterms(100);
```

### Step 3: Configure RLS (if needed)

The schema already includes basic RLS policies:

- Authenticated users can read rules
- Service role can do everything

If additional permissions are needed:

```sql
-- Allow insert for admins
CREATE POLICY "Allow insert for admins"
ON compliance_rules FOR INSERT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Allow update for compliance officers
CREATE POLICY "Allow update for compliance officers"
ON compliance_rules FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'compliance'));
```

## Usage

### In Interface

1. Go to page `/dashboard/compliance`
2. You will see:
   - **Stats Overview**: General rule statistics
   - **Category Breakdown**: Breakdown by category
   - **Quick Actions**: Quick actions panel
   - **Regulatory Coverage**: Jurisdiction coverage
   - **Rules Table**: Detailed table of all rules

3. Clicking a rule opens a modal with details:
   - Description and severity
   - Regulatory info
   - Detection keywords
   - Alert messages
   - Trigger statistics

### In Code

```typescript
import { createClient } from "@/lib/supabase-server";

// Get all active rules
const { data: rules } = await supabase
  .from("compliance_rules")
  .select("*")
  .eq("is_active", true)
  .order("risk_score", { ascending: false });

// Get rules by category
const { data: insiderRules } = await supabase
  .from("compliance_rules")
  .select("*")
  .eq("category", "insider_trading");

// Get statistics
const { data: stats } = await supabase
  .from("v_rules_stats")
  .select("*")
  .single();

// Increment trigger counter
await supabase.rpc("increment_rule_trigger", {
  p_rule_code: "SEC_GUARANTEE_001",
});
```

### Integration with ElevenLabs Scribe V2

```typescript
// Get keyterms to send to ElevenLabs API
const { data: keyterms } = await supabase.rpc("get_elevenlabs_keyterms", {
  max_terms: 100,
});

// Use in ElevenLabs API
const response = await fetch("https://api.elevenlabs.io/v1/scribe", {
  method: "POST",
  headers: {
    "xi-api-key": process.env.ELEVENLABS_API_KEY!,
  },
  body: JSON.stringify({
    audio: audioBuffer,
    keyterms: keyterms, // Up to 100 key phrases
  }),
});
```

## Rule Structure

Each rule includes:

```typescript
{
  // Identification
  rule_code: "SEC_GUARANTEE_001",
  name: "Prohibited Investment Guarantees",

  // Severity & Risk
  severity: "high",
  risk_score: 85,

  // Detection
  patterns: ["regex patterns..."],
  keywords: ["keywords..."],
  elevenlabs_keyterms: ["phrases for Scribe..."],

  // Regulation
  jurisdiction: "US",
  regulation_code: "SEC Rule 206(4)-1",

  // Actions
  primary_action: "warn_agent",
  alert_message: "Message for agent...",

  // Analytics
  total_triggers: 0,
  false_positive_count: 0,
}
```

## Rule Categories

### 🚨 Critical Severity

- **insider_trading**: Insider information discussion
- **market_manipulation**: Market manipulation
- **threat**: Threats

### ⚠️ High Severity

- **prohibited_language**: Prohibited yield guarantees
- **pii_disclosure**: PII disclosure
- **pci_violation**: PCI DSS violation (card data)
- **phi_violation**: HIPAA violation (medical data)
- **fraud_indicator**: Fraud indicators

### ⚡ Medium Severity

- **pressure_sales**: High-pressure sales
- **unsuitable_advice**: Unsuitable recommendations
- **off_channel**: Moving to unofficial channels
- **profanity**: Profanity
- **discrimination**: Discrimination

### ℹ️ Low Severity

- **prohibited_language**: Competitor mentions
- Complaint indicators
- Recording disclosure

## Actions

- `alert_only`: Show alert only
- `warn_agent`: Warn agent
- `notify_supervisor`: Notify supervisor
- `pause_recording`: Pause recording (for PCI)
- `escalate_compliance`: Escalate to compliance
- `stop_call`: Recommend ending call
- `immediate_review`: Immediate review
- `auto_flag`: Auto flag

## Adding New Rules

### Via SQL

```sql
INSERT INTO compliance_rules (
  rule_code, name, description, category, severity, risk_score,
  patterns, keywords, primary_action
) VALUES (
  'CUSTOM_001',
  'Custom Rule Name',
  'Rule description',
  'prohibited_language',
  'medium',
  60,
  ARRAY['regex pattern 1', 'pattern 2'],
  ARRAY['keyword1', 'keyword2'],
  'warn_agent'
);
```

### Via API (Future functionality)

```typescript
// POST /api/compliance/rules
const response = await fetch("/api/compliance/rules", {
  method: "POST",
  body: JSON.stringify({
    rule_code: "CUSTOM_001",
    name: "Custom Rule",
    // ... other fields
  }),
});
```

## Monitoring and Analytics

### Key Metrics

- **Total Rules**: Total number of rules
- **Active Rules**: Active rules
- **Critical/High/Medium/Low**: By severity
- **Total Triggers**: Number of triggers
- **False Positive Rate**: Percentage of false positives

### Data Export

```sql
-- Export rules to CSV
COPY (
  SELECT rule_code, name, category, severity, risk_score, total_triggers
  FROM compliance_rules
  WHERE is_active = true
) TO '/tmp/compliance_rules.csv' WITH CSV HEADER;

-- Trigger report
SELECT
  category,
  severity,
  COUNT(*) as rules_count,
  SUM(total_triggers) as total_triggers,
  ROUND(AVG(false_positive_rate) * 100, 2) as avg_fp_rate
FROM compliance_rules
WHERE is_active = true
GROUP BY category, severity
ORDER BY total_triggers DESC;
```

## Troubleshooting

### Rules not showing

1. Check that schema is imported:

   ```sql
   SELECT COUNT(*) FROM compliance_rules;
   ```

2. Check RLS policies:

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'compliance_rules';
   ```

3. Ensure user is authenticated

### Error accessing views

Views require same permissions as base tables. Ensure RLS is configured correctly.

### Slow loading

If table is large (>10000 rules), add additional indexes:

```sql
CREATE INDEX idx_rules_risk_score ON compliance_rules(risk_score DESC);
CREATE INDEX idx_rules_category_severity ON compliance_rules(category, severity);
```

## Roadmap

- [ ] Real-time detection during recording
- [ ] Webhooks for alerts
- [ ] ML models to improve detection
- [ ] Report export to PDF/Excel
- [ ] Integration with Slack/Teams for notifications
- [ ] Audit log for all rule changes
- [ ] A/B testing for rules
- [ ] Automatic threshold calibration

## Regulatory Info

### Covered Regulations

- **SEC**: Securities Exchange Commission (US)
  - Rule 206(4)-1: Investment Adviser Marketing
  - Rule 10b-5: Anti-fraud
  - Rule 17a-4: Recordkeeping

- **FINRA**: Financial Industry Regulatory Authority
  - Rule 2111: Suitability
  - Rule 2210: Communications with the Public
  - Rule 3110: Supervision

- **GDPR**: General Data Protection Regulation (EU)
- **MiFID II**: Markets in Financial Instruments Directive (EU)
- **PCI DSS**: Payment Card Industry Data Security Standard
- **HIPAA**: Health Insurance Portability and Accountability Act

## Support

For questions and support:

- GitHub Issues: [voxguard-ai/issues](https://github.com/yourusername/voxguard-ai/issues)
- Email: compliance@voxguard.ai

---

**Created for:** ElevenLabs Scribe V2 Hackathon
**Date:** January 2026
**Version:** 1.0.0
