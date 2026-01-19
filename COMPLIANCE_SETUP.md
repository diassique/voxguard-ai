# Compliance Rules Engine - Setup Guide

## Overview

Этот раздел предоставляет полноценный Compliance Rules Engine для мониторинга голосовых записей на соответствие регуляторным требованиям (SEC, FINRA, GDPR, MiFID II, PCI DSS, HIPAA и др.).

## Возможности

- ✅ **19 предустановленных правил** по категориям:
  - 🚨 Critical (3 правила): Insider Trading, Market Manipulation, Threats
  - ⚠️ High (6 правил): Investment Guarantees, PII/PCI/PHI violations, Fraud indicators
  - ⚡ Medium (6 правил): Pressure sales, Unsuitable advice, Off-channel communication
  - ℹ️ Low (4 правила): Competitor mentions, Complaints, Recording consent

- 📊 **Статистика и аналитика** в реальном времени
- 🎯 **Детекция по ключевым словам** и regex-паттернам
- 🌍 **Поддержка юрисдикций**: US, EU, UK, GLOBAL, APAC
- 🔔 **Настраиваемые действия**: от алертов до остановки звонка
- 📈 **Risk scoring** с весами и множителями
- 🔍 **Интеграция с ElevenLabs Scribe V2** keyterms

## Установка

### Шаг 1: Импорт схемы в Supabase

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **SQL Editor**
3. Создайте новый запрос
4. Скопируйте весь SQL из файла со схемой (который вы предоставили)
5. Выполните запрос

Схема создаст:
- ✅ Таблицу `compliance_rules` с 19 предзаполненными правилами
- ✅ Views: `v_rules_stats`, `v_rules_by_category`, `v_elevenlabs_keyterms`
- ✅ Functions: `get_elevenlabs_keyterms()`, `get_realtime_rules()`, `increment_rule_trigger()`
- ✅ RLS (Row Level Security) политики

### Шаг 2: Проверка установки

Выполните в SQL Editor:

```sql
-- Проверить количество правил
SELECT COUNT(*) FROM compliance_rules;
-- Должно вернуть: 19

-- Посмотреть статистику
SELECT * FROM v_rules_stats;

-- Посмотреть правила по категориям
SELECT * FROM v_rules_by_category;

-- Получить keyterms для ElevenLabs (максимум 100)
SELECT get_elevenlabs_keyterms(100);
```

### Шаг 3: Настройка RLS (если нужно)

Схема уже включает базовые RLS политики:
- Authenticated пользователи могут читать правила
- Service role может делать всё

Если нужны дополнительные права:

```sql
-- Разрешить создание правил для админов
CREATE POLICY "Allow insert for admins"
ON compliance_rules FOR INSERT
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Разрешить обновление правил для compliance officers
CREATE POLICY "Allow update for compliance officers"
ON compliance_rules FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' IN ('admin', 'compliance'));
```

## Использование

### В интерфейсе

1. Перейдите на страницу `/dashboard/compliance`
2. Вы увидите:
   - **Stats Overview**: Общая статистика по правилам
   - **Category Breakdown**: Разбивка по категориям
   - **Quick Actions**: Быстрые действия
   - **Regulatory Coverage**: Покрытие юрисдикций
   - **Rules Table**: Детальная таблица всех правил

3. Клик по правилу откроет модальное окно с детальной информацией:
   - Описание и severity
   - Регуляторная информация
   - Ключевые слова для детекции
   - Алерт-сообщения
   - Статистика срабатываний

### В коде

```typescript
import { createClient } from '@/lib/supabase-server';

// Получить все активные правила
const { data: rules } = await supabase
  .from('compliance_rules')
  .select('*')
  .eq('is_active', true)
  .order('risk_score', { ascending: false });

// Получить правила по категории
const { data: insiderRules } = await supabase
  .from('compliance_rules')
  .select('*')
  .eq('category', 'insider_trading');

// Получить статистику
const { data: stats } = await supabase
  .from('v_rules_stats')
  .select('*')
  .single();

// Инкрементировать счётчик срабатываний
await supabase.rpc('increment_rule_trigger', {
  p_rule_code: 'SEC_GUARANTEE_001'
});
```

### Интеграция с ElevenLabs Scribe V2

```typescript
// Получить keyterms для отправки в ElevenLabs API
const { data: keyterms } = await supabase
  .rpc('get_elevenlabs_keyterms', { max_terms: 100 });

// Использовать в ElevenLabs API
const response = await fetch('https://api.elevenlabs.io/v1/scribe', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY!,
  },
  body: JSON.stringify({
    audio: audioBuffer,
    keyterms: keyterms, // До 100 ключевых фраз
  }),
});
```

## Структура правила

Каждое правило включает:

```typescript
{
  // Идентификация
  rule_code: "SEC_GUARANTEE_001",
  name: "Prohibited Investment Guarantees",

  // Severity & Risk
  severity: "high",
  risk_score: 85,

  // Детекция
  patterns: ["regex patterns..."],
  keywords: ["ключевые слова..."],
  elevenlabs_keyterms: ["фразы для Scribe..."],

  // Регуляция
  jurisdiction: "US",
  regulation_code: "SEC Rule 206(4)-1",

  // Действия
  primary_action: "warn_agent",
  alert_message: "Сообщение для агента...",

  // Аналитика
  total_triggers: 0,
  false_positive_count: 0,
}
```

## Категории правил

### 🚨 Critical Severity
- **insider_trading**: Обсуждение инсайдерской информации
- **market_manipulation**: Манипулирование рынком
- **threat**: Угрозы

### ⚠️ High Severity
- **prohibited_language**: Запрещённые гарантии доходности
- **pii_disclosure**: Раскрытие персональных данных
- **pci_violation**: Нарушение PCI DSS (карточные данные)
- **phi_violation**: Нарушение HIPAA (медицинские данные)
- **fraud_indicator**: Индикаторы мошенничества

### ⚡ Medium Severity
- **pressure_sales**: Агрессивные продажи
- **unsuitable_advice**: Неподходящие рекомендации
- **off_channel**: Уход в неофициальные каналы
- **profanity**: Ненормативная лексика
- **discrimination**: Дискриминация

### ℹ️ Low Severity
- **prohibited_language**: Упоминание конкурентов
- Индикаторы жалоб
- Раскрытие записи

## Actions

- `alert_only`: Только показать алерт
- `warn_agent`: Предупредить агента
- `notify_supervisor`: Уведомить супервайзера
- `pause_recording`: Приостановить запись (для PCI)
- `escalate_compliance`: Эскалация в compliance
- `stop_call`: Рекомендовать прекратить звонок
- `immediate_review`: Немедленная проверка
- `auto_flag`: Автоматически пометить

## Добавление новых правил

### Через SQL

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

### Через API (будущая функциональность)

```typescript
// POST /api/compliance/rules
const response = await fetch('/api/compliance/rules', {
  method: 'POST',
  body: JSON.stringify({
    rule_code: 'CUSTOM_001',
    name: 'Custom Rule',
    // ... остальные поля
  }),
});
```

## Мониторинг и аналитика

### Ключевые метрики

- **Total Rules**: Общее количество правил
- **Active Rules**: Активные правила
- **Critical/High/Medium/Low**: По severity
- **Total Triggers**: Количество срабатываний
- **False Positive Rate**: Процент ложных срабатываний

### Экспорт данных

```sql
-- Экспорт правил в CSV
COPY (
  SELECT rule_code, name, category, severity, risk_score, total_triggers
  FROM compliance_rules
  WHERE is_active = true
) TO '/tmp/compliance_rules.csv' WITH CSV HEADER;

-- Отчёт по срабатываниям
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

### Не отображаются правила

1. Проверьте, что схема импортирована:
   ```sql
   SELECT COUNT(*) FROM compliance_rules;
   ```

2. Проверьте RLS политики:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'compliance_rules';
   ```

3. Проверьте, что пользователь авторизован

### Ошибка доступа к views

Views требуют тех же прав, что и базовые таблицы. Убедитесь, что RLS правильно настроен.

### Медленная загрузка

Если таблица большая (>10000 правил), добавьте дополнительные индексы:

```sql
CREATE INDEX idx_rules_risk_score ON compliance_rules(risk_score DESC);
CREATE INDEX idx_rules_category_severity ON compliance_rules(category, severity);
```

## Roadmap

- [ ] Real-time детекция во время записи
- [ ] Webhooks для алертов
- [ ] ML-модели для улучшения детекции
- [ ] Экспорт отчётов в PDF/Excel
- [ ] Интеграция с Slack/Teams для уведомлений
- [ ] Audit log для всех изменений правил
- [ ] A/B тестирование правил
- [ ] Автоматическая калибровка thresholds

## Регуляторная информация

### Covered Regulations

- **SEC**: Securities Exchange Commission (США)
  - Rule 206(4)-1: Investment Adviser Marketing
  - Rule 10b-5: Anti-fraud
  - Rule 17a-4: Recordkeeping

- **FINRA**: Financial Industry Regulatory Authority
  - Rule 2111: Suitability
  - Rule 2210: Communications with the Public
  - Rule 3110: Supervision

- **GDPR**: General Data Protection Regulation (ЕС)
- **MiFID II**: Markets in Financial Instruments Directive (ЕС)
- **PCI DSS**: Payment Card Industry Data Security Standard
- **HIPAA**: Health Insurance Portability and Accountability Act

## Support

Для вопросов и поддержки:
- GitHub Issues: [voxguard-ai/issues](https://github.com/yourusername/voxguard-ai/issues)
- Email: compliance@voxguard.ai

---

**Создано для:** ElevenLabs Scribe V2 Hackathon
**Дата:** January 2026
**Версия:** 1.0.0
