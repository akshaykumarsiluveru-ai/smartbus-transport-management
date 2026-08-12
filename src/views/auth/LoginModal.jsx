import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bus, Lock, Mail, User, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const LoginModal = () => {
  const { login, loginAsRole, setAuthView, authSuccessMessage, prefilledEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('student@smartbus.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle prefilled email from registration
  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
      setPassword(''); // prompt user to enter their newly registered password
    }
  }, [prefilledEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const res = await login(email, password);
    if (res && !res.success) {
      setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200/80 shadow-2xl p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Bus className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">SmartBus System</h2>
          <p className="text-xs text-slate-500 font-medium">Bus Tracking & Transport Management Portal</p>
        </div>

        {/* Success Alert Banner (Post-Registration) */}
        {authSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2.5 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Account Created Successfully!</span>
              <span className="text-emerald-700">{authSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="name@smartbus.edu"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/30 hover:brightness-105 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Registration */}
        <div className="text-center pt-1">
          <p className="text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setAuthView('register')}
              className="font-bold text-brand-600 hover:text-brand-800 hover:underline transition-colors ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>

        {/* Quick Demo Role Switcher Pills */}
        <div className="border-t border-slate-100 pt-4 text-center space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instant Quick Demo Switcher</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => loginAsRole('student')}
              className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex flex-col items-center justify-center gap-0.5"
            >
              <span>Student Demo</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsRole('driver')}
              className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 transition-colors flex flex-col items-center justify-center gap-0.5"
            >
              <span>Driver Demo</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsRole('admin')}
              className="py-2.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex flex-col items-center justify-center gap-0.5"
            >
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
