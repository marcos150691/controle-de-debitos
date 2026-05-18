import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";

interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  type: 'total' | 'pending' | 'paid';
}

export function StatCard({ title, amount, icon: Icon, type }: StatCardProps) {
  const isPaid = type === 'paid';
  const isPending = type === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass p-4 rounded-2xl relative overflow-hidden group",
        isPaid && "income-gradient",
        isPending && "expense-gradient"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium tracking-wider uppercase opacity-50">{title}</span>
        <div className={cn(
          "p-2 rounded-xl glass",
          isPaid && "text-emerald-400",
          isPending && "text-rose-400",
          type === 'total' && "text-accent"
        )}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className={cn(
          "text-2xl font-bold tracking-tight",
          type === 'total' && "text-accent"
        )}>
          {type === 'total' ? Math.round(amount || 0) : formatCurrency(amount)}
        </h3>
        <p className="text-sm opacity-40 font-mono">
          Atualizado agora
        </p>
      </div>

      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={120} strokeWidth={1} />
      </div>
    </motion.div>
  );
}
