import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  className,
  label,
  error,
  icon,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
          {label}
        </label>
      )
      }
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-white transition-all outline-none',
            icon && 'pl-12',
            error && 'border-rose-500 focus:border-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-rose-500 text-xs font-medium ml-1">
          {error}
        </p>
      )}
    </div>
  );
}
