import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({
  children,
  className,
  onClick,
  hover = true
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all',
        hover && onClick && 'hover:border-slate-900 dark:hover:border-white hover:shadow-xl cursor-pointer active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  );
}
