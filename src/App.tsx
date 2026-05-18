/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, FormEvent, Component, ReactNode, ErrorInfo } from 'react';
import { Wallet, ShieldAlert, CheckCircle2, LayoutDashboard, Settings, LogOut, ReceiptText, Camera, Tag, CreditCard, Home, Zap, HeartPulse, GraduationCap, PartyPopper, ShoppingBag, Plus as PlusIcon, Trash2, DollarSign, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addMonths, isSameMonth, startOfMonth } from 'date-fns';
import { Debt, DebtStatus, DebtStats, Category } from './types';
import { cn } from './lib/utils';
import { StatCard } from './components/StatCard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { ReceiptManager } from './components/ReceiptManager';

function CategoryCreator({ onAdd }: { onAdd: (name: string, icon: string, color: string) => void }) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  
  const icons = [
    { name: 'Tag', icon: Tag },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Home', icon: Home },
    { name: 'Zap', icon: Zap },
    { name: 'HeartPulse', icon: HeartPulse },
    { name: 'GraduationCap', icon: GraduationCap },
    { name: 'PartyPopper', icon: PartyPopper },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'DollarSign', icon: DollarSign },
  ];

  const colors = [
    '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#ffffff', '#71717a'
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAdd(name, selectedIcon, selectedColor);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-3">
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da categoria..."
          className="w-full min-h-[3.5rem] bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:opacity-20 text-base text-center font-bold"
        />
        <button 
          type="submit"
          disabled={!name}
          className="w-full min-h-[3.5rem] bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-20 shadow-xl shadow-white/5"
        >
          Criar Categoria
        </button>
      </div>

      <div className="space-y-3">
        <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {icons.map(({ name: iconName, icon: Icon }) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setSelectedIcon(iconName)}
              className={cn(
                "p-3 rounded-xl transition-all border",
                selectedIcon === iconName ? "bg-accent/20 border-accent text-accent" : "bg-white/5 border-transparent text-white/30"
              )}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1">Cor</label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                selectedColor === color ? "border-white scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <input 
            type="color" 
            value={selectedColor} 
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-8 h-8 rounded-full bg-transparent border-2 border-white/10 cursor-pointer overflow-hidden p-0"
          />
        </div>
      </div>
    </form>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert size={48} className="text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">Ocorreu um erro inesperado na interface. Tente resetar os dados se o problema persistir.</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-90 active:scale-95 transition-all"
            >
              Recarregar Página
            </button>
            <button 
              onClick={() => { if(window.confirm("Isso apagará todos os seus dados. Continuar?")) { localStorage.clear(); window.location.reload(); } }}
              className="px-6 py-3 border border-white/10 text-white/40 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
            >
              Limpar Todos os Dados
            </button>
          </div>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

export default function App() {
  const [debts, setDebts] = useState<Debt[]>(() => {
    try {
      const saved = localStorage.getItem('finans_debts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(d => d && typeof d === 'object' && d.id) : [];
    } catch (e) {
      console.error("Error loading debts:", e);
      return [];
    }
  });

  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('finans_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading categories:", e);
    }
    
    return [
      { id: '1', name: 'Cartão de Crédito', icon: 'CreditCard', color: '#6366f1' },
      { id: '2', name: 'Empréstimo', icon: 'DollarSign', color: '#f59e0b' },
      { id: '3', name: 'Aluguel', icon: 'Home', color: '#8b5cf6' },
      { id: '4', name: 'Contas Fixas', icon: 'Zap', color: '#ec4899' },
      { id: '5', name: 'Saúde', icon: 'HeartPulse', color: '#f43f5e' },
      { id: '6', name: 'Educação', icon: 'GraduationCap', color: '#0ea5e9' },
      { id: '7', name: 'Lazer', icon: 'PartyPopper', color: '#10b981' },
      { id: '8', name: 'Outros', icon: 'Tag', color: '#71717a' }
    ];
  });

  const [activeTab, setActiveTab] = useState<'debts' | 'receipts' | 'settings'>('debts');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [monthOffset, setMonthOffset] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: 'virtual' | 'real' | 'recurring', description: string } | null>(null);

  useEffect(() => {
    if (debtToEdit) {
      setIsFormOpen(true);
    }
  }, [debtToEdit]);

  useEffect(() => {
    const savedColor = localStorage.getItem('theme-color');
    if (savedColor) {
      setThemeColor(savedColor);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
    localStorage.setItem('theme-color', themeColor);
    
    // Helper to extract RGB
    const r = parseInt(themeColor.slice(1, 3), 16);
    const g = parseInt(themeColor.slice(3, 5), 16);
    const b = parseInt(themeColor.slice(5, 7), 16);
    document.documentElement.style.setProperty('--theme-color-rgb', `${r}, ${g}, ${b}`);
  }, [themeColor]);

  useEffect(() => {
    try {
      localStorage.setItem('finans_debts', JSON.stringify(debts));
    } catch (e) {
      console.error("Error saving debts:", e);
    }
  }, [debts]);

  useEffect(() => {
    try {
      localStorage.setItem('finans_categories_v2', JSON.stringify(categories));
    } catch (e) {
      console.error("Error saving categories:", e);
    }
  }, [categories]);

  const stats: DebtStats = useMemo(() => {
    try {
      const selectedDate = startOfMonth(addMonths(new Date(), monthOffset));
      
      // Project debts for the selected month to calculate accurate stats
      const currentMonthReal = debts.filter(d => {
        if (!d || !d.dueDate) return false;
        const dDate = new Date(d.dueDate);
        return !isNaN(dDate.getTime()) && isSameMonth(dDate, selectedDate);
      });
      
      let displayedDebtsForMonth = currentMonthReal;

      // Always include recurring debts for the selected month
      const recurringDebts = debts.filter(d => d && (d.isFixed || d.isInstallment));
      const projected: Debt[] = [...currentMonthReal];

      recurringDebts.forEach(debt => {
        if (!debt.dueDate) return;
        const dDate = new Date(debt.dueDate);
        if (isNaN(dDate.getTime())) return;

        const startDate = startOfMonth(dDate);
        if (selectedDate > startDate) {
          const alreadyExists = currentMonthReal.find(d => 
            d.description === debt.description && 
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
              } as Debt);
            }
          } else if (debt.isInstallment && debt.totalInstallments && debt.currentInstallment) {
            const projectedInstallment = debt.currentInstallment + monthsDiff;
            if (projectedInstallment <= debt.totalInstallments) {
              const newDate = addMonths(dDate, monthsDiff);
              if (!isNaN(newDate.getTime())) {
                projected.push({
                  ...debt,
                  id: `${debt.id}-proj-${monthOffset}`,
                  dueDate: newDate.toISOString(),
                  currentInstallment: projectedInstallment,
                  status: 'pending',
                } as Debt);
              }
            }
          }
        }
      });
      displayedDebtsForMonth = projected;

      const totalPending = (displayedDebtsForMonth || [])
        .filter((d) => d && d.status === 'pending')
        .reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);
      const totalPaid = (displayedDebtsForMonth || [])
        .filter((d) => d && d.status === 'paid')
        .reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);

      return {
        totalPending,
        totalPaid,
        debtCount: (displayedDebtsForMonth || []).filter(d => d && d.status === 'pending').length,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalPending: 0,
        totalPaid: 0,
        debtCount: 0
      };
    }
  }, [debts, monthOffset]);

  const addDebt = (data: Omit<Debt, 'id' | 'createdAt'>) => {
    try {
      const newDebt: Debt = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
      };
      setDebts((prev) => [newDebt, ...(Array.isArray(prev) ? prev : [])]);
    } catch (e) {
      console.error("Error adding debt:", e);
    }
  };

  const updateDebt = (id: string, data: Partial<Debt>) => {
    try {
      setDebts((prev) => (Array.isArray(prev) ? prev : []).map((d) => (d && d.id === id) ? { ...d, ...data } : d));
      setDebtToEdit(null);
    } catch (e) {
      console.error("Error updating debt:", e);
    }
  };

  const deleteDebt = (id: string) => {
    const debt = id.includes('-proj-') 
      ? debts.find(d => d.id === id.split('-proj-')[0]) 
      : debts.find(d => d.id === id);

    if (!debt) {
      setDebts(prev => prev.filter(d => d.id !== id));
      return;
    }

    if (id.includes('-proj-')) {
      setDeleteConfirmation({ id, type: 'virtual', description: debt.description });
    } else if (debt.isInstallment || debt.isFixed) {
      setDeleteConfirmation({ id, type: 'recurring', description: debt.description });
    } else {
      setDeleteConfirmation({ id, type: 'real', description: debt.description });
    }
  };

  const confirmDelete = (choice?: string) => {
    if (!deleteConfirmation) return;
    const { id, type } = deleteConfirmation;

    if (type === 'virtual') {
      const originalId = id.split('-proj-')[0];
      setDebts((prev) => prev.filter((d) => d && d.id !== originalId));
    } else if (type === 'recurring') {
      const debtToDelete = debts.find(d => d.id === id);
      if (!debtToDelete) return;

      if (choice === '1') {
        setDebts((prev) => prev.filter((d) => d && d.id !== id));
      } else if (choice === '2') {
        const deleteDate = new Date(debtToDelete.dueDate);
        setDebts((prev) => prev.filter((d) => {
          if (!d) return false;
          if (d.description === debtToDelete.description && d.category === debtToDelete.category) {
            const dDate = new Date(d.dueDate);
            return dDate < deleteDate;
          }
          return d.id !== id;
        }));
      } else if (choice === '3') {
        setDebts((prev) => prev.filter((d) => {
          if (!d) return false;
          return !(d.description === debtToDelete.description && d.category === debtToDelete.category);
        }));
      }
    } else {
      setDebts((prev) => prev.filter((d) => d && d.id !== id));
    }
    
    setDeleteConfirmation(null);
  };

  const addCategory = (name: string, icon: string, color: string) => {
    const newCategory: Category = {
      id: Math.random().toString(36).substring(7),
      name,
      icon,
      color
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCategory = (id: string) => {
    const category = categories.find(c => c && c.id === id);
    if (!category) return;

    const isUsed = (debts || []).some(d => d && d.category === category.name);
    const message = isUsed 
      ? `A categoria "${category.name}" está sendo usada em alguns lançamentos. Ao apagá-la, esses lançamentos ficarão "Sem Categoria". Deseja continuar?`
      : `Deseja realmente apagar a categoria "${category.name}"?`;

    if (window.confirm(message)) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const deleteMultipleDebts = (ids: string[]) => {
    if (ids.length === 0) return;
    if (window.confirm(`Deseja realmente apagar os ${ids.length} lançamentos selecionados?`)) {
      setDebts((prev) => prev.filter((d) => d && !ids.includes(d.id)));
    }
  };

  const toggleDebtStatus = (id: string) => {
    setDebts((prev) => prev.map((d) => 
      (d && d.id === id) ? { ...d, status: d.status === 'paid' ? 'pending' : 'paid' } : d
    ));
  };

  const iconsMap: Record<string, LucideIcon> = {
    Tag, CreditCard, Home, Zap, HeartPulse, GraduationCap, PartyPopper, ShoppingBag, DollarSign
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black text-white selection:bg-accent/30">
      {/* Sidebar - Desktop Only */}
      <aside className="fixed left-0 top-0 bottom-0 w-24 hidden lg:flex flex-col items-center py-4 border-r border-white/5 bg-black z-40">
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
          <ReceiptText className="text-white" size={24} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-4">
          <button 
            onClick={() => setActiveTab('debts')}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === 'debts' ? "text-accent bg-accent-soft" : "text-white/30 hover:text-white"
            )}
          >
            <LayoutDashboard size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('receipts')}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === 'receipts' ? "text-accent bg-accent-soft" : "text-white/30 hover:text-white"
            )}
          >
            <Camera size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === 'settings' ? "text-accent bg-accent-soft" : "text-white/30 hover:text-white"
            )}
          >
            <Settings size={24} />
          </button>

          <button 
            onClick={() => {
              setActiveTab('debts');
              setDebtToEdit(null);
              setIsFormOpen(true);
            }}
            className={cn(
              "p-3 rounded-2xl transition-all mt-4 relative group",
              isFormOpen && !debtToEdit ? "text-accent bg-accent-soft" : "text-white/30 hover:text-white"
            )}
            title="Adicionar Débito"
          >
            <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity" />
            <PlusIcon size={24} className="relative z-10" />
          </button>
        </nav>

        <button className="p-3 text-white/20 hover:text-rose-400 transition-all mt-auto">
          <LogOut size={24} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-24 p-4 lg:p-6 max-w-[1600px] mx-auto pb-20 lg:pb-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold tracking-tighter mb-1"
            >
              Controle de Débitos
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs opacity-40 uppercase tracking-[0.5em] font-black"
            >
              Gestão de Passivos e Obrigações
            </motion.p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Status da Carteira</p>
              <p className={cn(
                "text-sm font-semibold",
                stats.totalPending > 5000 ? "text-rose-500" : "text-emerald-400"
              )}>
                {stats.totalPending > 5000 ? "Atenção Crítica" : "Sob Controle"}
              </p>
            </div>
          </div>
        </header>

        {activeTab === 'debts' ? (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
            {/* List Section (Now on the Left) */}
            <div className="xl:col-span-2 order-2 xl:order-1">
              <div className="sticky top-6 space-y-3">
                <TransactionList 
                  debts={debts} 
                  categories={categories}
                  onDelete={deleteDebt} 
                  onDeleteMultiple={deleteMultipleDebts}
                  onToggleStatus={toggleDebtStatus}
                  onEdit={setDebtToEdit}
                  monthOffset={monthOffset}
                  setMonthOffset={setMonthOffset}
                />
              </div>
            </div>

            {/* Stats & Charts Section (Now on the Right) */}
            <div className="xl:col-span-3 space-y-3 order-1 xl:order-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard 
                  title="Total Pendente" 
                  amount={stats.totalPending} 
                  icon={ShieldAlert} 
                  type="pending" 
                />
                <StatCard 
                  title="Total Liquidado" 
                  amount={stats.totalPaid} 
                  icon={CheckCircle2} 
                  type="paid" 
                />
                <StatCard 
                  title="Contas Ativas" 
                  amount={stats.debtCount} 
                  icon={ReceiptText} 
                  type="total" 
                />
              </div>


            </div>
          </div>
        ) : activeTab === 'receipts' ? (
          <ReceiptManager onAddDebt={addDebt} />
        ) : (
          <div className="max-w-2xl mx-auto space-y-8 mt-12 pb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-8 rounded-[40px] border-white/5"
            >
              <h2 className="text-2xl font-bold mb-2">Personalização</h2>
              <p className="text-white/40 text-sm mb-8">Defina a cor principal do seu painel financeiro.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase font-bold tracking-widest opacity-40 mb-4 block">Cor do Painel</label>
                  <div className="flex flex-wrap gap-4">
                    {['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all scale-100 hover:scale-110",
                          themeColor === color ? "border-white scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <div className="relative group">
                      <input 
                        type="color" 
                        value={themeColor} 
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-10 h-10 rounded-full bg-transparent border-2 border-white/10 cursor-pointer overflow-hidden p-0"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-1 h-4 bg-white/20 rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-[40px] border-white/5"
            >
              <h2 className="text-2xl font-bold mb-2">Categorias</h2>
              <p className="text-white/40 text-sm mb-8">Gerencie suas categorias de gastos.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const IconComp = iconsMap[cat.icon] || Tag;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[28px] border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      />
                      <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
                        <button 
                          onClick={() => {
                            const iconKeys = Object.keys(iconsMap);
                            const currentIndex = iconKeys.indexOf(cat.icon);
                            const nextIcon = iconKeys[(currentIndex + 1) % iconKeys.length];
                            updateCategory(cat.id, { icon: nextIcon });
                          }}
                          className="min-h-[3.5rem] w-14 rounded-2xl flex items-center justify-center shadow-2xl relative group-hover:scale-105 transition-transform cursor-pointer shrink-0"
                          style={{ backgroundColor: `${cat.color || '#6366f1'}20`, color: cat.color || '#6366f1' }}
                          title="Clique para mudar o ícone"
                        >
                          <div className="absolute inset-0 rounded-2xl blur-lg opacity-40" style={{ backgroundColor: cat.color || '#6366f1' }} />
                          <IconComp size={28} className="relative z-10" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <input 
                            type="text"
                            value={cat.name}
                            onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                            className="font-black text-lg tracking-tight block text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] bg-transparent border-none focus:outline-none w-full focus:ring-1 focus:ring-white/10 rounded px-1 -ml-1 transition-all truncate"
                            spellCheck={false}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs uppercase tracking-[0.2em] font-black shrink-0" style={{ color: cat.color }}>Ativa</span>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5 shrink-0">
                              <input 
                                type="color" 
                                value={cat.color || '#6366f1'} 
                                onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                                className="w-4 h-4 rounded-md bg-transparent cursor-pointer overflow-hidden p-0 border-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeCategory(cat.id)}
                        className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-all relative z-10 rounded-xl shrink-0 ml-2"
                        title="Apagar categoria"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 mb-6 font-mono">Nova Categoria</h4>
                <div className="max-w-md mx-auto text-left">
                  <CategoryCreator onAdd={addCategory} />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <TransactionForm 
          onAdd={addDebt} 
          onUpdate={updateDebt}
          debtToEdit={debtToEdit}
          onCancelEdit={() => setDebtToEdit(null)}
          categories={categories}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden glass shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 px-6 py-4 z-40 flex items-center justify-around rounded-t-[32px]">
        <button 
          onClick={() => setActiveTab('debts')}
          className={cn(
            "p-3 rounded-2xl transition-all relative flex flex-col items-center gap-1",
            activeTab === 'debts' ? "text-accent bg-accent-soft" : "text-white/30"
          )}
        >
          <LayoutDashboard size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Painel</span>
        </button>
        <button 
          onClick={() => setActiveTab('receipts')}
          className={cn(
            "p-3 rounded-2xl transition-all relative flex flex-col items-center gap-1",
            activeTab === 'receipts' ? "text-accent bg-accent-soft" : "text-white/30"
          )}
        >
          <Camera size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Recibos</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('debts');
            setDebtToEdit(null);
            setIsFormOpen(true);
          }}
          className={cn(
            "p-4 -mt-12 rounded-full transition-all relative flex flex-col items-center gap-1 bg-accent text-white shadow-xl shadow-accent/20 border-4 border-black",
          )}
        >
          <PlusIcon size={24} />
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "p-3 rounded-2xl transition-all relative flex flex-col items-center gap-1",
            activeTab === 'settings' ? "text-accent bg-accent-soft" : "text-white/30"
          )}
        >
          <Settings size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Configuração</span>
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-accent/3 blur-[150px] rounded-full" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/3 blur-[120px] rounded-full" />
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
              
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
                <Trash2 size={32} />
              </div>

              <h3 className="text-xl font-bold mb-2">Excluir Lançamento?</h3>
              <p className="text-white/40 text-sm mb-8">
                Você está prestes a excluir <span className="text-white font-bold">"{deleteConfirmation.description}"</span>. 
                {deleteConfirmation.type === 'virtual' && " Esta é uma projeção futura. Excluí-la interromperá as cobranças automáticas."}
              </p>

              <div className="space-y-3">
                {deleteConfirmation.type === 'recurring' ? (
                  <>
                    <button 
                      onClick={() => confirmDelete('1')}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Apenas esta parcela
                    </button>
                    <button 
                      onClick={() => confirmDelete('2')}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-rose-500/80"
                    >
                      Esta e todas as futuras
                    </button>
                    <button 
                      onClick={() => confirmDelete('3')}
                      className="w-full py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      Todas (inclusive passadas)
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => confirmDelete()}
                    className="w-full py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Confirmar Exclusão
                  </button>
                )}
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="w-full py-4 bg-transparent text-white/40 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

