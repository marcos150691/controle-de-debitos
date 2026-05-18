import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Debt, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Trash2, CheckCircle2, Circle, Calendar, Edit3, Tag, CreditCard, Home, Zap, HeartPulse, GraduationCap, PartyPopper, ShoppingBag, DollarSign, LucideIcon, TrendingUp, Filter, ChevronLeft, ChevronRight, FileDown, CheckSquare, Square } from 'lucide-react';
import { format, addMonths, isSameMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ICON_MAP: Record<string, LucideIcon> = {
  Tag,
  CreditCard,
  Home,
  Zap,
  HeartPulse,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  DollarSign
};

interface DebtListProps {
  debts: Debt[];
  categories: Category[];
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (debt: Debt) => void;
  monthOffset: number;
  setMonthOffset: (offset: number | ((prev: number) => number)) => void;
}

export function TransactionList({ 
  debts, 
  categories, 
  onDelete, 
  onDeleteMultiple,
  onToggleStatus, 
  onEdit,
  monthOffset,
  setMonthOffset
}: DebtListProps) {

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const selectedDate = useMemo(() => startOfMonth(addMonths(new Date(), monthOffset)), [monthOffset]);
  const selectedMonthLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === displayedDebts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedDebts.map(d => d.id)));
    }
  };

  const exportToPDF = () => {
    const debtsToExport = displayedDebts.filter(d => selectedIds.has(d.id));
    if (debtsToExport.length === 0) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Débitos - ' + selectedMonthLabel, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), 14, 30);

    const tableRows = debtsToExport.map(d => [
      d.description,
      d.category || 'Sem Categoria',
      new Date(d.dueDate).toLocaleDateString('pt-BR'),
      d.status === 'paid' ? 'Pago' : 'Pendente',
      d.isInstallment && !d.isFixed ? `${d.currentInstallment}/${d.totalInstallments}` : (d.isFixed ? 'Fixa' : 'Avulsa'),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.amount)
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Descrição', 'Categoria', 'Vencimento', 'Status', 'Tipo/Parcela', 'Valor']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }, // Accent color #6366f1
      styles: { fontSize: 9 },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });

    const total = debtsToExport.reduce((sum, d) => sum + Number(d.amount), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total do Período: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`, 14, finalY);

    doc.save(`relatorio-debitos-${selectedMonthLabel.toLowerCase().replace(/ /g, '-')}.pdf`);
  };

  // Project debts for the selected month
  const displayedDebts = useMemo(() => {
    try {
      // Current month real debts
      const currentMonthReal = (Array.isArray(debts) ? debts : []).filter(d => {
        if (!d || !d.dueDate) return false;
        const dDate = new Date(d.dueDate);
        return !isNaN(dDate.getTime()) && isSameMonth(dDate, selectedDate);
      });
      
      // Always include recurring debts for the selected month
      const recurringDebts = (Array.isArray(debts) ? debts : []).filter(d => d && (d.isFixed || d.isInstallment));
      const projected: (Debt & { isVirtual?: boolean })[] = [...currentMonthReal];

      recurringDebts.forEach(debt => {
        if (!debt || !debt.dueDate || !debt.id) return;
        const dDate = new Date(debt.dueDate);
        if (isNaN(dDate.getTime())) return;

        const startDate = startOfMonth(dDate);
        
        // Only project if the selected month is AFTER the debt's starting month
        if (selectedDate > startDate) {
          // Check if it's already in the list (real debt for this month)
          const alreadyExists = currentMonthReal.find(d => 
            d && d.description === debt.description && 
            d.category === debt.category &&
            (d.isFixed || d.isInstallment)
          );

          if (alreadyExists) return;

          const monthsDiff = (selectedDate.getFullYear() - startDate.getFullYear()) * 12 + (selectedDate.getMonth() - startDate.getMonth());
          if (isNaN(monthsDiff) || monthsDiff < 0) return;

          if (debt.isFixed) {
            const newDate = addMonths(dDate, monthsDiff);
            if (!isNaN(newDate.getTime())) {
              projected.push({
                ...debt,
                id: `${debt.id}-proj-${monthOffset}`,
                dueDate: newDate.toISOString(),
                status: 'pending',
                isVirtual: true
              } as Debt & { isVirtual?: boolean });
            }
          } else if (debt.isInstallment && debt.totalInstallments && debt.currentInstallment) {
            const projectedInstallment = (Number(debt.currentInstallment) || 0) + monthsDiff;
            if (projectedInstallment <= (Number(debt.totalInstallments) || 0)) {
              const newDate = addMonths(dDate, monthsDiff);
              if (!isNaN(newDate.getTime())) {
                projected.push({
                  ...debt,
                  id: `${debt.id}-proj-${monthOffset}`,
                  dueDate: newDate.toISOString(),
                  currentInstallment: projectedInstallment,
                  status: 'pending',
                  isVirtual: true
                } as Debt & { isVirtual?: boolean });
              }
            }
          }
        }
      });

      return projected;
    } catch (e) {
      console.error("Error projecting debts:", e);
      return [];
    }
  }, [debts, selectedDate, monthOffset]);

  const safeFormatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Data inválida';
      return format(d, "dd 'de' MMM", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (debts.length === 0 && monthOffset === 0) {
    return (
      <div className="glass p-12 rounded-[40px] text-center border border-white/5 flex flex-col items-center">
        <p className="opacity-40 italic">Nenhum débito encontrado.</p>
        <p className="text-xs opacity-20 mt-2 tracking-widest uppercase font-black">Paz financeira absoluta</p>
      </div>
    );
  }
  // Group debts by month and category
  const groupedData = useMemo(() => {
    try {
      return displayedDebts.reduce((acc: Record<string, { 
        total: number, 
        categories: Record<string, { items: (Debt & { isVirtual?: boolean })[], total: number }> 
      }>, debt) => {
        if (!debt || !debt.dueDate) return acc;
        
        const date = new Date(debt.dueDate);
        if (isNaN(date.getTime())) return acc;

        const monthKey = format(date, "MMMM 'de' yyyy", { locale: ptBR });
        const category = debt.category || 'Sem Categoria';
        const amount = Number(debt.amount) || 0;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, categories: {} };
        }
        
        if (!acc[monthKey].categories[category]) {
          acc[monthKey].categories[category] = { items: [], total: 0 };
        }
        
        acc[monthKey].categories[category].items.push(debt);
        acc[monthKey].categories[category].total += amount;
        acc[monthKey].total += amount;
        
        return acc;
      }, {} as Record<string, { 
        total: number, 
        categories: Record<string, { items: (Debt & { isVirtual?: boolean })[], total: number }> 
      }>);
    } catch (err) {
      console.error("Error grouping data:", err);
      return {};
    }
  }, [displayedDebts]);

  const monthKeyToDisplay = useMemo(() => {
    // We prefer the current selected month label
    if (groupedData[selectedMonthLabel]) return selectedMonthLabel;
    
    // Fallback to the first key if available
    const keys = Object.keys(groupedData);
    if (keys.length > 0) return keys[0];
    
    return selectedMonthLabel;
  }, [groupedData, selectedMonthLabel]);

  const currentMonthData = groupedData[monthKeyToDisplay];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-accent" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Débito Mensal</h2>
            </div>
            
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
              <button 
                onClick={() => setMonthOffset(prev => prev - 1)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setMonthOffset(0)}
                className="px-3 text-xs font-black uppercase tracking-widest text-white/40 hover:text-accent transition-colors"
              >
                Hoje
              </button>
              <button 
                onClick={() => setMonthOffset(prev => prev + 1)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds(new Set());
              }}
              className={cn(
                "p-2.5 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                isSelectionMode ? "bg-accent border-accent text-white" : "bg-white/5 border-white/5 text-white/40 hover:text-white"
              )}
            >
              <CheckSquare size={14} />
              {isSelectionMode ? 'Sair' : 'Selecionar'}
            </button>
          </div>
        </div>

        {isSelectionMode && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 glass rounded-2xl border border-accent/20"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                {selectedIds.size === displayedDebts.length ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {selectedIds.size} selecionados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToPDF}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 disabled:opacity-20 transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
              >
                <FileDown size={14} />
                PDF
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {!currentMonthData ? (
        <div className="glass p-12 rounded-[40px] text-center border border-white/5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
            <Calendar size={32} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/60 mb-2 italic">{monthKeyToDisplay}</h3>
          <p className="opacity-40 italic text-sm">Nenhum lançamento para este período.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative pt-4 pb-1 px-1">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 py-1 min-w-0">
                <div className="min-w-[2.5rem] min-h-[2.5rem] rounded-xl flex items-center justify-center shadow-lg bg-white/5 border border-white/10 text-accent group-hover:scale-110 transition-transform">
                  <Calendar size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black uppercase tracking-[0.2em] text-accent italic">
                      {monthKeyToDisplay} 
                    </h3>
                  </div>
                  <span className="text-xs opacity-40 font-black tracking-widest uppercase text-accent">
                    {Object.values(currentMonthData.categories || {}).reduce((sum: number, cat) => sum + ((cat as any)?.items?.length || 0), 0)} Lançamentos
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest opacity-30 font-black mb-1">Total Previsto</p>
                <div className="text-base font-black font-mono tracking-tighter text-accent">
                  {formatCurrency(currentMonthData.total)}
                </div>
              </div>
            </div>
            <div className="h-[2px] w-full rounded-full transition-all opacity-20 bg-gradient-to-r from-accent to-transparent" />
          </div>

          <div className="space-y-6 pl-2 border-l border-white/5 ml-2">
            {Object.keys(currentMonthData.categories || {}).sort().map((categoryKey) => {
              const categoryData = currentMonthData.categories[categoryKey] as { items: (Debt & { isVirtual?: boolean })[], total: number };
              if (!categoryData) return null;
              
              const { items, total: catTotal } = categoryData;
                const catInfo = (categories || []).find(c => c && c.name === categoryKey);
                const Icon = catInfo ? (ICON_MAP[catInfo.icon] || Tag) : Tag;
                const groupColor = catInfo?.color || '#a1a1aa';

                return (
                  <div key={categoryKey} className="space-y-2">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-lg flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: `${groupColor}20`, color: groupColor }}
                        >
                          <Icon size={12} />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                          {categoryKey}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-white/20">Subtotal</span>
                        <span className="text-sm font-black font-mono" style={{ color: groupColor }}>
                          {formatCurrency(catTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      {items.map((d, index) => {
                        if (!d) return null;
                        const dDate = new Date(d.dueDate);
                        const isOverdue = !isNaN(dDate.getTime()) && dDate < new Date() && d.status === 'pending';
                        const isVirtual = d.isVirtual;
                        const isLastInstallment = d.isInstallment && !d.isFixed && d.currentInstallment && d.totalInstallments && Number(d.currentInstallment) === Number(d.totalInstallments);
                      
                        return (
                          <motion.div
                            key={d.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.01 }}
                            className={cn(
                              "group glass p-3 rounded-[20px] flex items-center justify-between hover:bg-white/[0.04] transition-all border border-white/5 relative overflow-hidden",
                              d.status === 'paid' && "opacity-50 grayscale-[0.5]",
                              isVirtual && "border-dashed border-white/10 bg-white/[0.01]",
                              isLastInstallment && "border-emerald-500/30 bg-emerald-500/[0.02] shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                            )}
                          >
                            {isVirtual && (
                              <div className="absolute top-0 right-0">
                                <div className="bg-accent/10 border-b border-l border-white/5 px-2 py-0.5 rounded-bl-xl">
                                  <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Previsto</span>
                                </div>
                              </div>
                            )}

                            {isLastInstallment && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2">
                                <div className="bg-emerald-500 text-black px-3 py-0.5 rounded-b-xl">
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Última Parcela</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3 py-1 min-w-0 flex-1 relative">
                              {/* Paid Stamp */}
                              <AnimatePresence>
                                {d.status === 'paid' && (
                                  <motion.div
                                    initial={{ scale: 2, opacity: 0, rotate: -15 }}
                                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                                  >
                                    <div className="border-4 border-emerald-500/30 px-6 py-2 rounded-xl rotate-[-12deg] backdrop-blur-[1px]">
                                      <span className="text-3xl font-black text-emerald-500/30 uppercase tracking-[0.2em] select-none">
                                        Pago
                                      </span>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {isSelectionMode ? (
                                <button
                                  onClick={() => toggleSelection(d.id)}
                                  className={cn(
                                    "min-w-[2.5rem] min-h-[2.5rem] rounded-xl flex items-center justify-center transition-all shrink-0",
                                    selectedIds.has(d.id) 
                                      ? "bg-accent text-white shadow-lg shadow-accent/40" 
                                      : "bg-white/5 text-white/20 hover:text-white/40"
                                  )}
                                >
                                  {selectedIds.has(d.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => !isVirtual && onToggleStatus(d.id)}
                                  disabled={isVirtual}
                                  className={cn(
                                    "min-w-[2.5rem] min-h-[2.5rem] rounded-xl flex items-center justify-center transition-all shrink-0",
                                    d.status === 'paid' 
                                      ? "bg-emerald-500/20 text-emerald-400" 
                                      : (isVirtual ? "bg-white/5 text-white/10" : (isOverdue ? "bg-rose-500/20 text-rose-500" : "bg-accent/10 text-accent/60 hover:text-accent"))
                                  )}
                                >
                                  {d.status === 'paid' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </button>
                              )}
                              
                              <div className="min-w-0">
                                <h4 className={cn(
                                  "font-bold text-base leading-tight mb-1 truncate",
                                  d.status === 'paid' ? "line-through opacity-50" : "text-accent",
                                  isVirtual && "opacity-60 italic"
                                )}>{d.description}</h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn(
                                    "flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest",
                                    isOverdue && !isVirtual ? "text-rose-500" : (d.status === 'paid' ? "text-white/20" : "text-accent/40")
                                  )}>
                                    <Calendar size={10} />
                                    {safeFormatDate(d.dueDate)}
                                  </span>

                                  {d.isInstallment && !d.isFixed && (
                                    <span className="text-sm font-black bg-accent/10 text-accent px-2 py-0.5 rounded-md border border-accent/10">
                                      {d.currentInstallment}/{d.totalInstallments}
                                    </span>
                                  )}

                                  {d.isFixed && (
                                    <span className="text-sm font-black bg-accent/10 text-accent px-2 py-0.5 rounded-md border border-accent/10 uppercase tracking-widest">
                                      FIXA
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className={cn(
                                "text-lg font-bold tracking-tighter",
                                d.status === 'paid' ? "text-white/40" : (isOverdue && !isVirtual ? "text-rose-500" : (isVirtual ? "text-white/30" : "text-accent"))
                              )}>
                                {formatCurrency(d.amount)}
                              </span>
                              
                              <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity relative z-10">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isVirtual) {
                                      const originalId = d.id.split('-proj-')[0];
                                      const originalDebt = debts.find(realDebt => realDebt.id === originalId);
                                      if (originalDebt) onEdit(originalDebt);
                                    } else {
                                      onEdit(d);
                                    }
                                  }}
                                  className="text-accent/60 hover:text-accent transition-colors flex items-center gap-1 p-1"
                                >
                                  <Edit3 size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(d.id);
                                  }}
                                  className="text-rose-500/60 hover:text-rose-500 transition-colors flex items-center gap-1 p-1"
                                >
                                  <Trash2 size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Excluir</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
}
