import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bus, LogOut, User } from 'lucide-react';
import RoleBadge from './RoleBadge';

const Navbar = () => {
  const { currentUser, role, logout } = useAuth();

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight leading-none text-white">SmartBus</h1>
            <p className="text-[11px] text-slate-400 font-medium">Tracking & Transport System</p>
          </div>
        </div>

        {/* User Profile & Logout Controls (Role switcher is restricted to login screen only) */}
        {currentUser && (
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* User Profile Pill */}
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <span className="text-xs font-bold hidden sm:inline text-slate-100">{currentUser.name}</span>
              <RoleBadge role={role} />
            </div>

            {/* Prominent Sign Out / Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-600 transition-all text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
