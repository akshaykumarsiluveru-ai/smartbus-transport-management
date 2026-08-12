import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

export const getPasswordStrength = (password = '') => {
  if (!password) {
    return { score: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-400', percentage: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (password.length < 8) {
    return {
      score: 1,
      label: 'Weak',
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      bgLight: 'bg-rose-50 border-rose-200',
      percentage: 25,
      hint: 'Password must be at least 8 characters long',
    };
  }

  if (score <= 2) {
    return {
      score: 2,
      label: 'Weak',
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      bgLight: 'bg-rose-50 border-rose-200',
      percentage: 35,
      hint: 'Include uppercase letters and numbers to strengthen',
    };
  }

  if (score === 3) {
    return {
      score: 3,
      label: 'Medium',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgLight: 'bg-amber-50 border-amber-200',
      percentage: 70,
      hint: 'Good! Add special characters (@$!%*?&) for maximum security',
    };
  }

  return {
    score: 4,
    label: 'Strong',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50 border-emerald-200',
    percentage: 100,
    hint: 'Excellent! Your password meets all security criteria',
  };
};

const PasswordStrengthIndicator = ({ password = '' }) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase & lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Contains numbers (0-9)', met: /\d/.test(password) },
    { label: 'Special character (@, #, $, etc.)', met: /[^a-zA-Z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-2 text-xs">
      {/* Strength Bar & Badge */}
      <div className="flex items-center justify-between">
        <span className="text-slate-500 font-semibold flex items-center gap-1">
          {strength.score >= 4 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          )}
          Security Strength:
        </span>
        <span
          className={`font-black uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-md border ${
            strength.bgLight || 'bg-slate-100'
          } ${strength.textColor}`}
        >
          {strength.label}
        </span>
      </div>

      {/* 3-Segment Progress Meter */}
      <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength.score >= 1 ? strength.color : 'bg-slate-200'
          }`}
        />
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength.score >= 3 ? strength.color : 'bg-slate-200'
          }`}
        />
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength.score >= 4 ? strength.color : 'bg-slate-200'
          }`}
        />
      </div>

      {/* Checklist Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px]">
        {checks.map((item, index) => (
          <div
            key={index}
            className={`flex items-center space-x-1.5 transition-colors ${
              item.met ? 'text-emerald-600 font-semibold' : 'text-slate-400'
            }`}
          >
            {item.met ? (
              <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-300 flex-shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
