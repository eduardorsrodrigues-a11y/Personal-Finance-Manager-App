import { ShoppingCart, Home, Utensils, Car, Film, Heart, Zap, DollarSign, MoreHorizontal, Users, ShoppingBasket, Plane, Gift, CreditCard, TrendingUp, Umbrella, Coffee, Dumbbell } from 'lucide-react';

export type CategoryConfig = {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  hex: string;
};

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Food:           { icon: Utensils,      bg: 'bg-white border border-border', text: 'text-red-500',    hex: '#ef4444' },
  Housing:        { icon: Home,          bg: 'bg-white border border-border', text: 'text-blue-500',   hex: '#3b82f6' },
  Utilities:      { icon: Zap,           bg: 'bg-white border border-border', text: 'text-yellow-500', hex: '#eab308' },
  Transportation: { icon: Car,           bg: 'bg-white border border-border', text: 'text-green-500',  hex: '#22c55e' },
  Shopping:       { icon: ShoppingCart,  bg: 'bg-white border border-border', text: 'text-orange-500', hex: '#f97316' },
  Health:         { icon: Heart,         bg: 'bg-white border border-border', text: 'text-pink-500',   hex: '#ec4899' },
  Entertainment:  { icon: Film,          bg: 'bg-white border border-border', text: 'text-purple-500', hex: '#a855f7' },
  'Family & Personal': { icon: Users,          bg: 'bg-white border border-border', text: 'text-indigo-500', hex: '#6366f1' },
  Groceries:      { icon: ShoppingBasket, bg: 'bg-white border border-border', text: 'text-green-600',  hex: '#16a34a' },
  Travel:         { icon: Plane,          bg: 'bg-white border border-border', text: 'text-sky-500',    hex: '#0ea5e9' },
  Gifts:          { icon: Gift,           bg: 'bg-white border border-border', text: 'text-rose-500',   hex: '#f43f5e' },
  'Gym & Sports': { icon: Dumbbell,       bg: 'bg-white border border-border', text: 'text-orange-500', hex: '#f97316' },
  Salary:         { icon: DollarSign,    bg: 'bg-white border border-border', text: 'text-emerald-500',hex: '#10b981' },
  Freelance:      { icon: DollarSign,    bg: 'bg-white border border-border', text: 'text-teal-500',   hex: '#14b8a6' },
  Investment:     { icon: DollarSign,    bg: 'bg-white border border-border', text: 'text-cyan-500',   hex: '#06b6d4' },
  Business:       { icon: DollarSign,    bg: 'bg-white border border-border', text: 'text-lime-500',   hex: '#84cc16' },
  Cashback:       { icon: CreditCard,    bg: 'bg-white border border-border', text: 'text-violet-500', hex: '#8b5cf6' },
  RSUs:           { icon: TrendingUp,    bg: 'bg-white border border-border', text: 'text-amber-500',  hex: '#f59e0b' },
  'Holiday Allowance': { icon: Umbrella, bg: 'bg-white border border-border', text: 'text-fuchsia-500',hex: '#d946ef' },
  'Meal Allowance':    { icon: Coffee,   bg: 'bg-white border border-border', text: 'text-stone-500',  hex: '#78716c' },
  Other:          { icon: MoreHorizontal,bg: 'bg-white border border-border', text: 'text-gray-500',   hex: '#6b7280' },
};

const FALLBACK: CategoryConfig = {
  icon: ShoppingCart,
  bg: 'bg-white border border-border',
  text: 'text-gray-500',
  hex: '#6b7280',
};

export function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_CONFIG[category] ?? FALLBACK;
}
