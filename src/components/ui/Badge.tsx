import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export default function Badge({ 
  children, 
  variant = 'default',
  className = '' 
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    primary: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    secondary: 'bg-slate-200 text-slate-600 hover:bg-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}