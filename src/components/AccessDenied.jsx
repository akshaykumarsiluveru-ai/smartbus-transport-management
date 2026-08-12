import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, LayoutDashboard, ArrowLeft } from 'lucide-react';
import RoleBadge from './RoleBadge';

const AccessDenied = ({ requiredRole = 'authorized personnel' }) => {
  const { currentUser, role, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-rose-200 shadow-2xl p-8 text-center space-y-6 animate-fade-in">
        
        {/* Security Shield Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black uppercase tracking-wider">
            Security Access Violation
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have permission to view this module. This section is strictly restricted to{' '}
            <strong className="text-slate-700 capitalize">{requiredRole}</strong> accounts.
          </p>
        </div>

        {/* Current User Session Info */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold">Active Account:</span>
            <span className="font-bold text-slate-800">{currentUser?.name || 'Unknown'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold">Your Assigned Role:</span>
            <RoleBadge role={role} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>

          <button
            onClick={logout}
            className="w-full py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccessDenied;
