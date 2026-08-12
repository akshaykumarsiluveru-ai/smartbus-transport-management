import React from 'react';

const StatusBadge = ({ status }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';

  if (status === 'In Transit' || status === 'On Trip' || status === 'In Progress' || status === 'In Review') {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    dot = 'bg-blue-500 animate-pulse';
  } else if (status === 'On Time' || status === 'Active' || status === 'Resolved') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  } else if (status === 'Delayed' || status === 'Pending' || status === 'Open') {
    bg = 'bg-amber-50 text-amber-800 border-amber-200';
    dot = 'bg-amber-500 animate-ping';
  } else if (status === 'Completed') {
    bg = 'bg-teal-50 text-teal-700 border-teal-200';
    dot = 'bg-teal-500';
  } else if (status === 'Cancelled' || status === 'Out of Service' || status === 'Maintenance') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500';
  } else if (status === 'At Depot' || status === 'Available' || status === 'Scheduled') {
    bg = 'bg-slate-100 text-slate-700 border-slate-300';
    dot = 'bg-slate-500';
  } else if (status === 'Off Duty' || status === 'On Leave' || status === 'Inactive') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    dot = 'bg-slate-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
