import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Debt, Category } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface CategoryChartProps {
  debts: Debt[];
  categories: Category[];
  currentMonthTotal: number;
  previousMonthTotal: number;
}

export function CategoryChart({ debts, categories, currentMonthTotal, previousMonthTotal }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const data = debts.reduce((acc, debt) => {
      const categoryName = debt.category || 'Outros';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += Number(debt.amount) || 0;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(data)
      .map(([name, value]) => {
        const cat = categories.find(c => c.name === name);
        return {
          name,
          value,
          color: cat?.color || '#ffffff'
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [debts, categories]);

  if (chartData.length === 0 && previousMonthTotal === 0) {
    return (
      <div className="glass p-6 rounded-[32px] border-white/5 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-white/40 text-sm font-bold">Sem dados para este mês e o anterior.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-2xl border-white/5 shadow-2xl">
          <p className="text-xs font-bold text-white/60 mb-1">{payload[0].name}</p>
          <p className="text-lg font-black" style={{ color: payload[0].payload.color }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const diff = currentMonthTotal - previousMonthTotal;
  const diffPercentage = previousMonthTotal > 0 
    ? (diff / previousMonthTotal) * 100 
    : (currentMonthTotal > 0 ? 100 : 0);

  const isHigher = diff > 0;
  const isLower = diff < 0;
  
  let comparisonText = 'Igual ao mês anterior';
  if (isHigher) {
    comparisonText = 'Mais alto que o mês anterior';
  } else if (isLower) {
    comparisonText = 'Mais baixo que o mês anterior';
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-[32px] border-white/5 flex flex-col items-center relative"
    >
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest opacity-40">Distribuição</h3>
        
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold",
          isHigher ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
          isLower ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
          "bg-white/5 text-white/60 border-white/10"
        )} title={comparisonText}>
          {isHigher && <TrendingUp size={14} />}
          {isLower && <TrendingDown size={14} />}
          {!isHigher && !isLower && <Minus size={14} />}
          <span>{diffPercentage > 0 ? '+' : ''}{diffPercentage.toFixed(1)}%</span>
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={110}
                outerRadius={140}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                content={(props) => {
                  const { payload } = props;
                  return (
                    <ul className="flex flex-wrap justify-center gap-4 mt-2">
                      {payload?.map((entry, index) => (
                        <li key={`item-${index}`} className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                            {entry.payload.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center w-full min-h-[200px]">
          <p className="text-white/40 text-sm font-bold">Sem despesas registradas.</p>
        </div>
      )}

      {/* Summary Note */}
      <div className="mt-2 text-center flex flex-col items-center gap-1">
        <p className="text-xs text-white/40">
          Mês atual: <strong className={isHigher ? "text-rose-500" : "text-white"}>{formatCurrency(currentMonthTotal)}</strong>
          <span className="mx-2">|</span>
          Anterior: <strong className={isLower ? "text-rose-500" : "text-white"}>{formatCurrency(previousMonthTotal)}</strong>
        </p>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
          isHigher ? "bg-rose-500/20 text-rose-500" : 
          isLower ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"
        )}>
          {isHigher ? 'Este mês está com valor mais alto' : 
           isLower ? 'O mês anterior foi mais alto' : 
           'Valores iguais nos dois meses'}
        </span>
      </div>
    </motion.div>
  );
}
