# Animation Components

Reusable animation components for VoxGuard AI.

## ComplianceAlertBadge

Animated badge for displaying compliance alerts.

### Animation Features

1. **Pulse Effect** - Badge smoothly changes opacity
2. **Ping Ring** - Expanding waves from center
3. **Bounce** - Icon gently bounces

### Usage

```tsx
import ComplianceAlertBadge from "@/components/animations/ComplianceAlertBadge";

<ComplianceAlertBadge
  onClick={(e) => {
    e.stopPropagation();
    handleAlertClick();
  }}
>
  Compliance Alert
</ComplianceAlertBadge>;
```

### Props

- `onClick` (function): Click handler
- `children` (ReactNode): Badge text (default: "Compliance Alert")

### Animation Psychology

Animation is designed with psychological principles in mind:

- **Attracting Attention**: Motion naturally draws the eye
- **Creating Urgency**: Pulse and ping create a sense of importance
- **Invitation to Action**: Bounce makes the element feel "alive"
- **Stress-free**: Slow (2s) animations are not annoying

### Accessibility

Component automatically disables animations for users with `prefers-reduced-motion` setting.

### Technical Details

- **Duration**: 2 seconds for all animations
- **Timing functions**:
  - Pulse: `cubic-bezier(0.4, 0, 0.6, 1)`
  - Ping: `cubic-bezier(0, 0, 0.2, 1)`
  - Bounce: `ease-in-out`
- **Colors**:
  - Background: `bg-red-50`
  - Text: `text-red-600`
  - Ring: `bg-red-200`
- **Hardware acceleration**: Uses `transform` instead of positioning

### Visualization

```
      ╭───────────────────────╮
      │   ╭─── Ring pulse    │
      │   │                   │
      │   │  🔺 Alert Text    │
      │   │  ↕ Bounce         │
      │   │                   │
      │   ╰─────────────────  │
      ╰───────────────────────╯
         ↕ Badge pulse
```

### Usage Examples

#### In Transcript (Current Implementation)

```tsx
{
  transcript.has_alert && (
    <ComplianceAlertBadge
      onClick={(e) => {
        e.stopPropagation();
        setSelectedTranscriptId(transcript.id);
        setShowAlertModal(true);
      }}
    />
  );
}
```

#### Custom Text

```tsx
<ComplianceAlertBadge onClick={handleClick}>
  {alertCount} Alerts
</ComplianceAlertBadge>
```

#### Without Animation (for users with motion sensitivity)

Animations are automatically disabled when system setting is present:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
}
```

### Performance

- Uses CSS animations (GPU-accelerated)
- Does not affect JavaScript event loop
- Minimal impact on battery life
- Optimized for 60 FPS

### Compatibility

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile browsers
