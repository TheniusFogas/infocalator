import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
}

export const StatCard = ({ icon: Icon, value, label, iconColor = "text-primary" }: StatCardProps) => {
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl bg-secondary flex items-center justify-center", iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};
