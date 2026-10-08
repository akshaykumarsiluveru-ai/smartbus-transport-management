import React from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './views/auth/LoginModal';
import RegisterModal from './views/auth/RegisterModal';
import StudentView from './views/student/StudentView';
import DriverView from './views/driver/DriverView';
import AdminView from './views/admin/AdminView';

function AppContent() {
  const { isAuthenticated, role, authView, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Connecting to SmartBus System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterModal />;
    }
    return <LoginModal />;
  }

  switch (role?.toLowerCase()) {
    case 'admin':
      return <AdminView />;
    case 'driver':
      return <DriverView />;
    case 'student':
    default:
      return <StudentView />;
  }
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <AppContent />
      </main>
    </div>
  );
}
