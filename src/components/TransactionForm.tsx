import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Calendar, DollarSign, Tag, CreditCard, Home, Zap, HeartPulse, GraduationCap, PartyPopper, ShoppingBag, LucideIcon } from 'lucide-react';
import { Debt, DebtStatus, Category } from '../types';
import { cn } from '../lib/utils';

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

interface DebtFormProps {
  onAdd: (data: Omit<Debt, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, data: Partial<Debt>) => void;
  debtToEdit: Debt | null;
  onCancelEdit: () => void;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionForm({ onAdd, onUpdate, debtToEdit, onCancelEdit, categories, isOpen, onClose }: DebtFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isInstallment, setIsInstallment] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('');

  useEffect(() => {
    if (debtToEdit) {
      setDescription(debtToEdit.description);
      setAmount(debtToEdit.amount.toString());
      setCategory(debtToEdit.category);
      setDueDate(debtToEdit.dueDate);
      setIsInstallment(debtToEdit.isInstallment || false);
      setIsFixed(debtToEdit.isFixed || false);
      setTotalInstallments(debtToEdit.totalInstallments?.toString() || '');
      setCurrentInstallment(debtToEdit.currentInstallment?.toString() || '');
    } else {
      resetForm();
    }
  }, [debtToEdit]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('');
    setDueDate('');
    setIsInstallment(false);
    setIsFixed(false);
    setTotalInstallments('');
    setCurrentInstallment('');
  };

  const handleClose = () => {
    onClose();
    if (debtToEdit) {
      onCancelEdit();
    }
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !dueDate) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    const debtData = {
      description,
      amount: parsedAmount,
      category,
      dueDate,
      isInstallment,
      isFixed,
      totalInstallments: (isInstallment && !isFixed) ? (parseInt(totalInstallments) || 1) : undefined,
      currentInstallment: (isInstallment && !isFixed) ? (parseInt(currentInstallment) || 1) : undefined,
    };

    if (debtToEdit) {
      onUpdate(debtToEdit.id, debtData);
    } else {
      onAdd({
        ...debtData,
        status: 'pending',
      });
    }

    handleClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[51] p-4 flex items-start md:items-center justify-center pointer-events-none overflow-y-auto"
            >
              <div className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px] w-full max-w-lg pointer-events-auto shadow-2xl border border-white/5 my-4 md:my-auto">
                <div className="flex items-center justify-between mb-6 md:mb-8 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-2 -mt-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                      {debtToEdit ? 'Editar Dívida' : 'Nova Dívida'}
                    </h2>
                    <p className="text-[11px] md:text-xs uppercase tracking-widest opacity-40 font-bold mt-1">
                      {debtToEdit ? 'Atualize as informações do débito' : 'Registre um novo passivo'}
                    </p>
                  </div>
                  <button onClick={handleClose} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1 flex items-center gap-2">
                        <Tag size={12} /> Descrição
                      </label>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Ex: Cartão de Crédito, Empréstimo..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:opacity-20 text-base"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1 flex items-center gap-2">
                          <DollarSign size={12} /> Valor
                        </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:opacity-20 text-base"
                          />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1 flex items-center gap-2">
                          <Calendar size={12} /> Vencimento
                        </label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all [color-scheme:dark] text-base"
                          />
                      </div>
                    </div>

                    <div className="space-y-3 p-4 glass rounded-2xl border border-white/5">
                      <div className="space-y-3">
                        <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1">Tipo de Dívida</label>
                        <div className="grid grid-cols-3 bg-white/5 p-1 rounded-xl gap-1">
                            <button
                              type="button"
                              onClick={() => { setIsInstallment(false); setIsFixed(false); }}
                              className={cn(
                                "py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all text-center",
                                (!isInstallment && !isFixed) ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                              )}
                            >
                              Avulsa
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsInstallment(true); setIsFixed(false); }}
                              className={cn(
                                "py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all text-center",
                                (isInstallment && !isFixed) ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                              )}
                            >
                              Parcelada
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsInstallment(true); setIsFixed(true); }}
                              className={cn(
                                "py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all text-center",
                                (isInstallment && isFixed) ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                              )}
                            >
                              Fixa
                            </button>
                        </div>
                      </div>

                      {isInstallment && !isFixed && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-2">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Parcela Atual</label>
                            <input
                              type="number"
                              placeholder="1"
                              value={currentInstallment}
                              onChange={(e) => setCurrentInstallment(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Total de Parcelas</label>
                            <input
                              type="number"
                              placeholder="12"
                              value={totalInstallments}
                              onChange={(e) => setTotalInstallments(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1 flex items-center justify-between">
                        <span>Categoria</span>
                        {category && !(categories || []).some(c => c && c.name === category) && (
                          <span className="text-[10px] text-accent lowercase">Personalizada: {category}</span>
                        )}
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-6 gap-x-2">
                        {(categories || []).map((cat) => {
                          if (!cat) return null;
                          const Icon = ICON_MAP[cat.icon] || Tag;
                          const isSelected = category === cat.name;
                          const catColor = cat.color || '#6366f1';
                          
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.name)}
                              className="flex flex-col items-center gap-2 group outline-none"
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={cn(
                                  "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                  isSelected 
                                    ? "shadow-2xl" 
                                    : "bg-white/5 border-white/10 opacity-30 group-hover:opacity-100 group-hover:border-white/20"
                                )}
                                style={isSelected ? { 
                                  backgroundColor: `${catColor}30`, 
                                  borderColor: catColor,
                                  color: catColor,
                                  boxShadow: `0 0 20px ${catColor}40`
                                } : {}}
                              >
                                <Icon size={isSelected ? 24 : 20} strokeWidth={isSelected ? 2.5 : 2} />
                              </motion.div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider text-center w-full truncate px-1 transition-colors",
                                isSelected ? "text-white" : "opacity-30 group-hover:opacity-60"
                              )}>
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
                          <Plus size={14} />
                        </div>
                        <input
                          type="text"
                          placeholder="Outra categoria..."
                          value={category && !(categories || []).some(c => c && c.name === category) ? category : ''}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:opacity-20 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-opacity-90 transition-all shadow-xl shadow-white/10 active:scale-95"
                  >
                    {debtToEdit ? 'Salvar Alterações' : 'Registrar Dívida'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
