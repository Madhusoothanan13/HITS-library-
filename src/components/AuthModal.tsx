import React, { useState } from 'react';
import { X, Lock, User as UserIcon, Shield, Sparkles, GraduationCap, Phone, Mail, BookOpen } from 'lucide-react';
import { loginApi, registerStudentApi } from '../services/api.js';
import { HitsLogo } from './HitsLogo.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (data: any) => void;
  departments: string[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  departments
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [roleMode, setRoleMode] = useState<'STUDENT' | 'ADMIN'>('STUDENT');

  // Login form state
  const [username, setUsername] = useState('24MCA01');
  const [password, setPassword] = useState('student123');

  // Register form state
  const [regRollNo, setRegRollNo] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState(departments[0] || 'Master of Computer Applications (MCA)');
  const [regSemester, setRegSemester] = useState('Semester 1');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleToggle = (role: 'STUDENT' | 'ADMIN') => {
    setRoleMode(role);
    setError(null);
    if (role === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('24MCA01');
      setPassword('student123');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi(username, password);
      onAuthSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await registerStudentApi({
        rollNo: regRollNo,
        name: regName,
        email: regEmail,
        department: regDept,
        semester: regSemester,
        phone: regPhone,
        password: regPassword
      });
      onAuthSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (userVal: string, passVal: string, role: 'STUDENT' | 'ADMIN') => {
    setRoleMode(role);
    setUsername(userVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1626] border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081220]">
          <div className="flex items-center gap-2.5">
            <HitsLogo size="sm" showText={false} />
            <div>
              <h3 className="text-base font-bold text-white leading-tight">HITS Central Library Portal</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Dr. K.C.G. Verghese Research &amp; Resource Centre</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-[#060c16]">
          <button
            onClick={() => { setActiveTab('LOGIN'); setError(null); }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center transition-colors border-b-2 ${
              activeTab === 'LOGIN' 
                ? 'border-[#009D4E] text-emerald-400 bg-slate-800/40 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('REGISTER'); setError(null); }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center transition-colors border-b-2 ${
              activeTab === 'REGISTER' 
                ? 'border-[#621708] text-amber-300 bg-[#621708]/20 font-bold' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Registration
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
            <span>&bull;</span>
            <p>{error}</p>
          </div>
        )}

        {activeTab === 'LOGIN' ? (
          <div className="p-6">
            {/* Role switch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-5 border border-slate-800">
              <button
                type="button"
                onClick={() => handleRoleToggle('STUDENT')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  roleMode === 'STUDENT'
                    ? 'bg-[#009D4E] text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Login
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle('ADMIN')}
                className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  roleMode === 'ADMIN'
                    ? 'bg-[#621708] text-amber-200 border border-amber-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Librarian Admin
              </button>
            </div>

            {/* Quick Demo Pre-fill Pills */}
            <div className="mb-4">
              <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                One-Click Demo Credentials:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('24MCA01', 'student123', 'STUDENT')}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                >
                  Student: Rahul (24MCA01)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('24MCA02', 'student123', 'STUDENT')}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
                >
                  Student: Priya (24MCA02)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin', 'admin123', 'ADMIN')}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 rounded border border-slate-700 transition-colors font-medium"
                >
                  Admin: (admin / admin123)
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {roleMode === 'STUDENT' ? 'Student ID / Roll No' : 'Admin Username'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={roleMode === 'STUDENT' ? 'e.g. 24MCA01' : 'admin'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Authenticating...' : `Sign in as ${roleMode === 'STUDENT' ? 'Student' : 'Librarian'}`}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Student Roll No *</label>
              <input
                type="text"
                required
                value={regRollNo}
                onChange={(e) => setRegRollNo(e.target.value.toUpperCase())}
                placeholder="e.g. 24MCA99"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Ananya Krishnan"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">College Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ananya@college.edu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department *</label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Semester</label>
                <select
                  value={regSemester}
                  onChange={(e) => setRegSemester(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Creating Student Account...' : 'Complete Registration & Get Digital Card'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
