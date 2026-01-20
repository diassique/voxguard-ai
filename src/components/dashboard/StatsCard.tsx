import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  variant?: "default" | "critical" | "high" | "medium" | "low";
}

const variantStyles = {
  default: {
    iconBg: "bg-gray-50",
    iconColor: "text-gray-600",
    valueColor: "text-gray-900",
  },
  critical: {
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    valueColor: "text-red-600",
  },
  high: {
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    valueColor: "text-yellow-600",
  },
  medium: {
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    valueColor: "text-orange-600",
  },
  low: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    valueColor: "text-blue-600",
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = "default",
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className={`text-3xl font-semibold mb-2 ${styles.valueColor}`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
              <span className="text-sm text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
