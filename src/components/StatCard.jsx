import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'brand' }) => {
  const colors = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
      <div className={`p-3.5 rounded-xl border ${colors[color] || colors.brand}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
