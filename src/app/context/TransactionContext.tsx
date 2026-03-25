import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Mock initial data
const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 5000,
    description: 'Monthly Salary',
    date: '2026-03-01',
    category: 'Salary',
  },
  {
    id: '2',
    type: 'expense',
    amount: 1200,
    description: 'Rent Payment',
    date: '2026-03-02',
    category: 'Housing',
  },
  {
    id: '3',
    type: 'expense',
    amount: 350,
    description: 'Grocery Shopping',
    date: '2026-03-05',
    category: 'Food',
  },
  {
    id: '4',
    type: 'expense',
    amount: 80,
    description: 'Internet Bill',
    date: '2026-03-08',
    category: 'Utilities',
  },
  {
    id: '5',
    type: 'income',
    amount: 500,
    description: 'Freelance Project',
    date: '2026-03-10',
    category: 'Freelance',
  },
  {
    id: '6',
    type: 'expense',
    amount: 150,
    description: 'Gym Membership',
    date: '2026-03-12',
    category: 'Health',
  },
  {
    id: '7',
    type: 'expense',
    amount: 45,
    description: 'Coffee & Snacks',
    date: '2026-03-15',
    category: 'Food',
  },
  {
    id: '8',
    type: 'expense',
    amount: 200,
    description: 'Clothing',
    date: '2026-03-18',
    category: 'Shopping',
  },
];

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
