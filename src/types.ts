export type DebtStatus = 'pending' | 'paid';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface Debt {
  id: string;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  status: DebtStatus;
  createdAt: string;
  isInstallment?: boolean;
  isFixed?: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
}

export interface DebtStats {
  totalPending: number;
  totalPaid: number;
  debtCount: number;
}
