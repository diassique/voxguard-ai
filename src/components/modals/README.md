# Modal Components

Reusable modal components for VoxGuard AI.

## BaseModal

A base wrapper component for creating modals with a consistent design.

### Usage

```tsx
import BaseModal from "@/components/modals/BaseModal";
import { AlertTriangle } from "lucide-react";

<BaseModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  subtitle="Optional subtitle"
  icon={AlertTriangle}
  iconBgColor="bg-red-100"
  iconColor="text-red-600"
  loading={false}
  footer={<button>Close</button>}
  maxWidth="3xl"
>
  {/* Modal content */}
</BaseModal>;
```

### Props

- `isOpen` (boolean): Whether modal is open
- `onClose` (function): Callback on close
- `title` (string): Modal title
- `subtitle?` (string): Subtitle (optional)
- `icon` (LucideIcon): Icon in header
- `iconBgColor?` (string): Icon background color (default: 'bg-red-100')
- `iconColor?` (string): Icon color (default: 'text-red-600')
- `children` (ReactNode): Modal content
- `loading?` (boolean): Whether to show loading state
- `loadingText?` (string): Text during loading
- `footer?` (ReactNode): Modal footer (optional)
- `maxWidth?` ('sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'): Max width

## ComplianceRuleDetailsModal

Modal for displaying detailed compliance rule information.

### Usage

```tsx
import ComplianceRuleDetailsModal from "@/components/modals/ComplianceRuleDetailsModal";

<ComplianceRuleDetailsModal
  isOpen={!!selectedRule}
  onClose={() => setSelectedRule(null)}
  rule={selectedRule}
/>;
```

### Props

- `isOpen` (boolean): Whether modal is open
- `onClose` (function): Callback on close
- `rule` (ComplianceRule | null): Rule to display

## ComplianceAlertModal

Modal for displaying compliance alerts.

### Usage

```tsx
import ComplianceAlertModal from "@/components/ComplianceAlertModal";

<ComplianceAlertModal
  isOpen={isOpen}
  onClose={handleClose}
  sessionId={sessionId}
  transcriptId={transcriptId}
/>;
```

### Props

- `isOpen` (boolean): Whether modal is open
- `onClose` (function): Callback on close
- `sessionId` (string): Session ID
- `transcriptId?` (string): Transcript ID (optional)

## Design Structure

All modals use a consistent structure:

1. **Header** - Title with icon and close button
2. **Content** - Scrollable content with loading state
3. **Footer** - Optional footer with actions

### Severity Color Scheme

- **Critical**: `bg-red-50`, `text-red-600`
- **High**: `bg-orange-50`, `text-orange-600`
- **Medium**: `bg-amber-50`, `text-amber-600`
- **Low**: `bg-blue-50`, `text-blue-600`
