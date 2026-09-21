import React, { useState } from 'react';
import { 
  BookOpen, 
  Bell, 
  CreditCard, 
  LogOut, 
  ShieldCheck, 
  GraduationCap, 
  Search, 
  CheckCheck,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { User, Student, LibraryNotification } from '../types.js';
import { HitsLogo } from './HitsLogo.js';

interface HeaderProps {
  user: User | null;
  student: Student | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: LibraryNotification[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenLibraryCard: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onQuickDemoSwitch: (role: 'STUDENT' | 'ADMIN') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  student,
  activeTab,
  setActiveTab,
  notifications,
  onOpenAuth,
  onLogout,
  onOpenLibraryCard,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onQuickDemoSwitch
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0c1829] border-b border-[#1e293b] text-white shadow-xl">
      {/* Official HITS Top Announcement & Institutional Bar */}
      <div className="bg-[#621708] text-amber-100 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between font-medium border-b border-amber-500/20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-semibold tracking-wide text-white">HINDUSTAN INSTITUTE OF TECHNOLOGY &amp; SCIENCE</span>
          <span className="text-amber-300/80 hidden sm:inline">&bull; (Deemed to be University)</span>
          <span className="text-amber-200 hidden md:inline">&bull; <em>"To Make Every Man A Success And No Man A Failure"</em></span>
          <a
            href="https://hindustanuniv.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white px-2 py-0.5 rounded transition-colors ml-1 border border-amber-400/30"
          >
            <span>hindustanuniv.ac.in</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="flex items-center gap-3 text-amber-200/90 text-[11px] mt-1 sm:mt-0">
          <span className="hidden lg:inline text-amber-300 font-medium">Founder's Block, Padur, Chennai</span>
          <span className="hidden lg:inline">&bull;</span>
          <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded border border-amber-500/20">
            <span className="text-amber-300">Quick Test:</span>
            <button 
              onClick={() => onQuickDemoSwitch('STUDENT')}
              className="underline hover:text-white px-1 font-bold text-amber-100"
              title="Switch to Student account (24MCA01)"
            >
              Student
            </button>
            <span>/</span>
            <button 
              onClick={() => onQuickDemoSwitch('ADMIN')}
              className="underline hover:text-white px-1 font-bold text-amber-100"
              title="Switch to Librarian Admin"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => setActiveTab('SEARCH')}
          >
            <HitsLogo size="md" />
            <div className="hidden sm:block border-l border-slate-700/80 pl-3">
              <div className="font-semibold text-xs tracking-wide text-emerald-400 uppercase">
                Dr. K.C.G. Verghese Research &amp; Resource Centre
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Central Library &bull; 8-Digit Physical Book ID System
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('SEARCH')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'SEARCH' 
                  ? 'bg-[#009D4E] text-white shadow-md shadow-emerald-950/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Search className="w-4 h-4" />
              Catalog &amp; 8-Digit Lookup
            </button>

            {user?.role === 'STUDENT' && (
              <>
                <button
                  onClick={() => setActiveTab('STUDENT_DASHBOARD')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'STUDENT_DASHBOARD' 
                      ? 'bg-[#009D4E] text-white shadow-md shadow-emerald-950/50' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('MY_BOOKS')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'MY_BOOKS' 
                      ? 'bg-[#009D4E] text-white shadow-md shadow-emerald-950/50' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  My Loans &amp; Holds
                </button>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('ADMIN_DASHBOARD')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'ADMIN_DASHBOARD' 
                    ? 'bg-[#621708] text-amber-100 border border-amber-500/40 shadow-md shadow-red-950/50' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Librarian Desk
              </button>
            )}
          </nav>

          {/* Right Action Icons & User */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Digital Card Button for Student */}
                {user.role === 'STUDENT' && student && (
                  <button
                    onClick={onOpenLibraryCard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#621708]/40 hover:bg-[#621708] text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold shadow-sm transition-all hover:border-amber-400"
                    title="View Digital Student Library Card"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">HITS Library Card</span>
                  </button>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Library Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#621708] text-amber-200 border border-amber-400 text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f1d33] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-100">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={onMarkAllNotificationsRead}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No notifications right now.
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => onMarkNotificationRead(n.id)}
                              className={`p-3 text-xs cursor-pointer hover:bg-slate-800/80 transition-colors ${
                                !n.read ? 'bg-emerald-950/30 border-l-2 border-[#009D4E]' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                                <span>{n.title}</span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-slate-400 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Pill */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#009D4E] flex items-center justify-center text-white font-bold text-[11px]">
                      {user.role === 'ADMIN' ? 'A' : (student?.name ? student.name[0] : 'S')}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-semibold text-slate-100 leading-tight">
                        {user.role === 'ADMIN' ? 'Chief Librarian' : (student?.name || user.name)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {user.role === 'ADMIN' ? 'HITS Staff' : student?.rollNo}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#0f1d33] border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <p className="text-xs font-semibold text-slate-100">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#621708] text-amber-200 border border-amber-500/30">
                          {user.role === 'ADMIN' ? 'HITS Central Library Admin' : `HITS Student • ${student?.department || 'Department'}`}
                        </span>
                      </div>

                      {user.role === 'STUDENT' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('STUDENT_DASHBOARD');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                            Student Dashboard
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('MY_BOOKS');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            My Loans &amp; Holds
                          </button>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setActiveTab('ADMIN_DASHBOARD');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          Librarian Desk
                        </button>
                      )}

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-[#009D4E] hover:bg-[#008643] text-white rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center gap-2"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

