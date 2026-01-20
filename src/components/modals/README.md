# Modal Components

Переиспользуемые модальные компоненты для VoxGuard AI.

## BaseModal

Базовый wrapper-компонент для создания модальных окон с единообразным дизайном.

### Использование

```tsx
import BaseModal from '@/components/modals/BaseModal';
import { AlertTriangle } from 'lucide-react';

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
</BaseModal>
```

### Props

- `isOpen` (boolean): Открыта ли модалка
- `onClose` (function): Callback при закрытии
- `title` (string): Заголовок модалки
- `subtitle?` (string): Подзаголовок (опционально)
- `icon` (LucideIcon): Иконка в заголовке
- `iconBgColor?` (string): Цвет фона иконки (по умолчанию: 'bg-red-100')
- `iconColor?` (string): Цвет иконки (по умолчанию: 'text-red-600')
- `children` (ReactNode): Контент модалки
- `loading?` (boolean): Показывать ли состояние загрузки
- `loadingText?` (string): Текст при загрузке
- `footer?` (ReactNode): Футер модалки (опционально)
- `maxWidth?` ('sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'): Максимальная ширина

## ComplianceRuleDetailsModal

Модалка для отображения детальной информации о правиле соответствия.

### Использование

```tsx
import ComplianceRuleDetailsModal from '@/components/modals/ComplianceRuleDetailsModal';

<ComplianceRuleDetailsModal
  isOpen={!!selectedRule}
  onClose={() => setSelectedRule(null)}
  rule={selectedRule}
/>
```

### Props

- `isOpen` (boolean): Открыта ли модалка
- `onClose` (function): Callback при закрытии
- `rule` (ComplianceRule | null): Правило для отображения

## ComplianceAlertModal

Модалка для отображения предупреждений о несоответствии требованиям.

### Использование

```tsx
import ComplianceAlertModal from '@/components/ComplianceAlertModal';

<ComplianceAlertModal
  isOpen={isOpen}
  onClose={handleClose}
  sessionId={sessionId}
  transcriptId={transcriptId}
/>
```

### Props

- `isOpen` (boolean): Открыта ли модалка
- `onClose` (function): Callback при закрытии
- `sessionId` (string): ID сессии
- `transcriptId?` (string): ID транскрипта (опционально)

## Структура дизайна

Все модалки используют единообразную структуру:

1. **Header** - Заголовок с иконкой и кнопкой закрытия
2. **Content** - Скроллируемый контент с состоянием загрузки
3. **Footer** - Опциональный футер с действиями

### Цветовая схема по severity

- **Critical**: `bg-red-50`, `text-red-600`
- **High**: `bg-orange-50`, `text-orange-600`
- **Medium**: `bg-amber-50`, `text-amber-600`
- **Low**: `bg-blue-50`, `text-blue-600`
