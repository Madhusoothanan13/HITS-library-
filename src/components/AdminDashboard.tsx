import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  BookOpen, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  BookmarkCheck, 
  CreditCard, 
  BarChart3, 
  Settings, 
  FileText, 
  Plus, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  QrCode, 
  Download, 
  Sparkles,
  Wrench,
  Clock,
  RefreshCw,
  Hash
} from 'lucide-react';
import { 
  DashboardStats, 
  Book, 
  BookCopy, 
  Student, 
  Reservation, 
  BorrowTransaction, 
  FineRecord, 
  WaitlistEntry, 
  LibrarySettings, 
  AuditLog 
} from '../types.js';
import {
  issueBookApi,
  returnBookApi,
  addBookApi,
  addCopyApi,
  updateCopyApi,
  updateStudentStatusApi,
  payFineApi,
  waiveFineApi,
  updateSettingsApi,
  getReportsApi
} from '../services/api.js';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  books: (Book & { copies: BookCopy[] })[];
  students: (Student & { activeLoansCount?: number; activeReservationsCount?: number; pendingFinesTotal?: number })[];
  reservations: Reservation[];
  transactions: BorrowTransaction[];
  fines: FineRecord[];
  waitlist: WaitlistEntry[];
  settings: LibrarySettings | null;
  auditLogs: AuditLog[];
  categories: string[];
  departments: string[];
  onRefreshData: () => void;
  onOpenQR: (copy: BookCopy, bookTitle: string, author: string) => void;
  onActionSuccess: (msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  books,
  students,
  reservations,
  transactions,
  fines,
  waitlist,
  settings,
  auditLogs,
  categories,
  departments,
  onRefreshData,
  onOpenQR,
  onActionSuccess
}) => {
  const [adminTab, setAdminTab] = useState<
    'OVERVIEW' | 'CIRCULATION' | 'BOOKS' | 'STUDENTS' | 'RESERVATIONS' | 'FINES' | 'REPORTS' | 'SETTINGS' | 'AUDIT'
  >('OVERVIEW');

  // Circulation desk forms
  const [issueRollNo, setIssueRollNo] = useState('');
  const [issueBookId, setIssueBookId] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  const [returnBookId, setReturnBookId] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [markMaintOnReturn, setMarkMaintOnReturn] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnResult, setReturnResult] = useState<any>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Add Book Form
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newEdition, setNewEdition] = useState('1st Edition');
  const [newPublisher, setNewPublisher] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0] || 'Computer Science');
  const [newSubject, setNewSubject] = useState('');
  const [newDept, setNewDept] = useState(departments[0] || 'Master of Computer Applications (MCA)');
  const [newShelf, setNewShelf] = useState('');
  const [newLocation, setNewLocation] = useState('Floor 2, Section A');
  const [newCoverUrl, setNewCoverUrl] = useState('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80');
  const [newCopiesCount, setNewCopiesCount] = useState(2);
  const [custom8DigitIdInput, setCustom8DigitIdInput] = useState('');
  const [addBookLoading, setAddBookLoading] = useState(false);
  const [addBookError, setAddBookError] = useState<string | null>(null);

  // Add Copy modal state
  const [addCopyBookTitleId, setAddCopyBookTitleId] = useState<string | null>(null);
  const [customCopyId, setCustomCopyId] = useState('');
  const [copyCondition, setCopyCondition] = useState('EXCELLENT');

  // Reports state
  const [reportsData, setReportsData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Settings form state
  const [editBorrowDays, setEditBorrowDays] = useState(settings?.standardBorrowPeriodDays || 14);
  const [editFineRate, setEditFineRate] = useState(settings?.finePerDayRupees || 5);
  const [editPickupHours, setEditPickupHours] = useState(settings?.pickupDeadlineHours || 48);
  const [editBorrowLimit, setEditBorrowLimit] = useState(settings?.maxBorrowLimitPerStudent || 3);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    if (adminTab === 'REPORTS') {
      setReportLoading(true);
      getReportsApi()
        .then(setReportsData)
        .catch(console.error)
        .finally(() => setReportLoading(false));
    }
  }, [adminTab]);

  // Issue Handler
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueLoading(true);
    setIssueError(null);
    try {
      const res = await issueBookApi({
        studentRollNo: issueRollNo.trim(),
        bookId: issueBookId.trim()
      });
      onActionSuccess(`Book ID ${res.transaction.bookId} ("${res.transaction.bookTitle}") issued to ${res.transaction.studentRollNo}. Due date: ${new Date(res.transaction.dueDate).toLocaleDateString()}`);
      setIssueRollNo('');
      setIssueBookId('');
      onRefreshData();
    } catch (err: any) {
      setIssueError(err.message || 'Failed to issue book');
    } finally {
      setIssueLoading(false);
    }
  };

  // Return Handler
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnLoading(true);
    setReturnError(null);
    setReturnResult(null);
    try {
      const res = await returnBookApi({
        bookId: returnBookId.trim(),
        conditionNotes: returnNotes,
        markMaintenance: markMaintOnReturn
      });
      setReturnResult(res);
      onActionSuccess(`Book ID ${res.copy.bookId} checked in successfully! Overdue: ${res.overdueDays} days. Fine calculated: ₹${res.fineAmount}`);
      setReturnBookId('');
      setReturnNotes('');
      setMarkMaintOnReturn(false);
      onRefreshData();
    } catch (err: any) {
      setReturnError(err.message || 'Failed to process return');
    } finally {
      setReturnLoading(false);
    }
  };

  // Add Book Handler
  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBookLoading(true);
    setAddBookError(null);
    try {
      const customIds = custom8DigitIdInput
        ? custom8DigitIdInput.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;

      const res = await addBookApi({
        title: newTitle,
        author: newAuthor,
        isbn: newIsbn,
        edition: newEdition,
        publisher: newPublisher,
        category: newCategory,
        subject: newSubject || newCategory,
        department: newDept,
        shelfNumber: newShelf,
        location: newLocation,
        coverUrl: newCoverUrl,
        initialCopiesCount: newCopiesCount,
        custom8DigitIds: customIds
      });

      onActionSuccess(`Added "${res.book.title}" with ${res.copies.length} copies (IDs: ${res.copies.map(c => c.bookId).join(', ')})`);
      setShowAddBookModal(false);
      // Reset form
      setNewTitle('');
      setNewAuthor('');
      setNewIsbn('');
      setNewShelf('');
      setCustom8DigitIdInput('');
      onRefreshData();
    } catch (err: any) {
      setAddBookError(err.message || 'Failed to add book');
    } finally {
      setAddBookLoading(false);
    }
  };

  // Add Copy to existing title
  const handleAddCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCopyBookTitleId) return;
    try {
      const res = await addCopyApi(addCopyBookTitleId, {
        bookId: customCopyId || undefined,
        condition: copyCondition
      });
      onActionSuccess(`Added physical copy [Book ID: ${res.copy.bookId}]`);
      setAddCopyBookTitleId(null);
      setCustomCopyId('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to add copy');
    }
  };

  // Toggle Copy Status (Maintenance / Available)
  const handleToggleMaintenance = async (copy: BookCopy) => {
    const nextStatus = copy.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await updateCopyApi(copy.bookId, { status: nextStatus });
      onActionSuccess(`Copy ${copy.bookId} status updated to ${nextStatus}`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update copy status');
    }
  };

  // Toggle Student Status
  const handleToggleStudentStatus = async (stu: Student) => {
    const next = stu.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateStudentStatusApi(stu.id, next);
      onActionSuccess(`Student ${stu.rollNo} account status set to ${next}`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update student');
    }
  };

  // Pay Fine
  const handlePayFine = async (fineId: string) => {
    const method = prompt('Enter payment method (e.g. Cash at Counter, UPI / QR Pay, Net Banking):', 'Cash at Counter');
    if (!method) return;
    try {
      const res = await payFineApi(fineId, method);
      onActionSuccess(`Fine marked as PAID (Receipt #${res.fine.receiptNumber})`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to process payment');
    }
  };

  // Waive Fine
  const handleWaiveFine = async (fineId: string) => {
    const reason = prompt('Enter justification / authority reason for waiving fine:', 'Academic Dean recommendation');
    if (!reason) return;
    try {
      await waiveFineApi(fineId, reason);
      onActionSuccess(`Fine waived successfully.`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to waive fine');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await updateSettingsApi({
        standardBorrowPeriodDays: Number(editBorrowDays),
        finePerDayRupees: Number(editFineRate),
        pickupDeadlineHours: Number(editPickupHours),
        maxBorrowLimitPerStudent: Number(editBorrowLimit)
      });
      onActionSuccess('Library rules & circulation configuration saved successfully.');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#0c1829] border border-amber-500/30 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#621708] border border-amber-400/40 flex items-center justify-center text-amber-200 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">HITS Librarian Circulation &amp; Control Desk</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#009D4E]/30 text-emerald-300 border border-[#009D4E] uppercase font-bold">
                Admin Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Dr. K.C.G. Verghese Research &amp; Resource Centre &bull; Founder's Block Physical Catalog &amp; Circulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddBookModal(true)}
            className="px-3.5 py-2 bg-[#009D4E] hover:bg-[#008742] text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Book &amp; Copies
          </button>
          <button
            onClick={onRefreshData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Refresh All Database Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1 text-xs font-semibold pb-1">
        {[
          { id: 'OVERVIEW', label: 'Dashboard Overview', icon: BarChart3 },
          { id: 'CIRCULATION', label: 'Issue & Return Desk', icon: ArrowDownLeft },
          { id: 'BOOKS', label: 'Book Catalog & 8-Digit Copies', icon: BookOpen },
          { id: 'STUDENTS', label: 'Student Accounts', icon: Users },
          { id: 'RESERVATIONS', label: 'Reservations & Waitlist', icon: BookmarkCheck },
          { id: 'FINES', label: 'Overdue Fines Desk', icon: CreditCard },
          { id: 'REPORTS', label: 'Reports & Export', icon: FileText },
          { id: 'SETTINGS', label: 'Circulation Rules', icon: Settings },
          { id: 'AUDIT', label: 'Audit Trails', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#621708] text-amber-200 border border-amber-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- 1. OVERVIEW TAB ---------------- */}
      {adminTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Total Book Titles</span>
              <div className="mt-2 text-2xl font-extrabold text-white">{stats?.totalBooks || 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">{stats?.totalCopies || 0} physical copies</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Available Copies</span>
              <div className="mt-2 text-2xl font-extrabold text-emerald-400">{stats?.availableCopies || 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">Ready on shelves</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Currently Issued</span>
              <div className="mt-2 text-2xl font-extrabold text-blue-400">{stats?.issuedCopies || 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">With students</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Overdue Copies</span>
              <div className="mt-2 text-2xl font-extrabold text-rose-400">{stats?.overdueCopies || 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">Due date passed</p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400">Total Fines Pending</span>
              <div className="mt-2 text-2xl font-extrabold text-amber-400">₹{stats?.totalFinesPending || 0}</div>
              <p className="text-[11px] text-slate-500 mt-1">₹{stats?.totalFinesCollected || 0} collected</p>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Circulation Card */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                Quick Counter Operations
              </h3>
              <p className="text-xs text-slate-400">
                Jump directly into book issue or return workflow by physical 8-digit copy ID.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAdminTab('CIRCULATION')}
                  className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 hover:border-emerald-500 text-left transition-all group"
                >
                  <ArrowUpRight className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-sm text-white">Issue Book</div>
                  <div className="text-[11px] text-slate-400">Check out to student roll no</div>
                </button>

                <button
                  onClick={() => setAdminTab('CIRCULATION')}
                  className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/80 hover:border-teal-500 text-left transition-all group"
                >
                  <ArrowDownLeft className="w-5 h-5 text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-sm text-white">Return Book</div>
                  <div className="text-[11px] text-slate-400">Calculate fines &amp; notify waitlist</div>
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Active Reservations awaiting pickup:</span>
                <strong className="text-teal-300 text-sm font-mono">{stats?.activeReservations || 0}</strong>
              </div>
            </div>

            {/* Recent Audit Actions */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-400" />
                  Recent System Audit Logs
                </h3>
                <button
                  onClick={() => setAdminTab('AUDIT')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between font-medium text-slate-300">
                      <span className="font-mono text-[11px] text-emerald-400">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. CIRCULATION TAB (ISSUE & RETURN) ---------------- */}
      {adminTab === 'CIRCULATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issue Book Panel */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Issue Physical Book</h3>
                <p className="text-xs text-slate-400">14-day standard borrowing period auto-calculated</p>
              </div>
            </div>

            {issueError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Student Roll No *</label>
                <input
                  type="text"
                  required
                  value={issueRollNo}
                  onChange={(e) => setIssueRollNo(e.target.value.toUpperCase())}
                  placeholder="e.g. 24MCA01"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Registered students:</span>
                  {students.slice(0, 3).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIssueRollNo(s.rollNo)}
                      className="text-emerald-400 hover:underline font-mono"
                    >
                      {s.rollNo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Exact 8-Digit Physical Book ID *</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={issueBookId}
                    onChange={(e) => setIssueBookId(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 58274103"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Loan Term: <strong className="text-emerald-400">{settings?.standardBorrowPeriodDays || 14} Days</strong></div>
                <div>Due Date Rule: Today + {settings?.standardBorrowPeriodDays || 14} days (system-calculated)</div>
                <div>Overdue Policy: ₹{settings?.finePerDayRupees || 5}/day after due date</div>
              </div>

              <button
                type="submit"
                disabled={issueLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 text-sm"
              >
                {issueLoading ? 'Validating & Issuing...' : 'Complete Book Issue'}
              </button>
            </form>
          </div>

          {/* Return Book Panel */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <ArrowDownLeft className="w-5 h-5 text-teal-400" />
              <div>
                <h3 className="text-base font-bold text-white">Check-in / Return Physical Book</h3>
                <p className="text-xs text-slate-400">Server computes overdue days, accrued fines &amp; waitlist</p>
              </div>
            </div>

            {returnError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{returnError}</span>
              </div>
            )}

            {returnResult && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-700/80 rounded-2xl text-xs space-y-1.5 text-emerald-200 animate-fade-in">
                <div className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Return Processed Successfully!
                </div>
                <div>Book: <strong>{returnResult.transaction.bookTitle}</strong> (ID: {returnResult.copy.bookId})</div>
                <div>Returned by: <strong>{returnResult.transaction.studentRollNo}</strong> ({returnResult.transaction.studentName})</div>
                <div>Overdue Days: <strong className="text-white">{returnResult.overdueDays}</strong></div>
                <div>
                  Calculated Fine: <strong className={returnResult.fineAmount > 0 ? 'text-rose-300 font-bold' : 'text-emerald-400'}>
                    ₹{returnResult.fineAmount}
                  </strong>
                </div>
                <div>Next Physical Status: <strong className="text-teal-300">{returnResult.copy.status}</strong></div>
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Enter 8-Digit Book ID to Return *</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={returnBookId}
                    onChange={(e) => setReturnBookId(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 58274103"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                {/* Active loans suggestion pills */}
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                  <span>Active loans:</span>
                  {transactions.filter(t => t.status !== 'RETURNED').slice(0, 3).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setReturnBookId(t.bookId)}
                      className="font-mono text-teal-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 hover:border-teal-500"
                    >
                      {t.bookId}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Physical Condition / Notes</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Pages intact, barcode verified"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="markMaint"
                  checked={markMaintOnReturn}
                  onChange={(e) => setMarkMaintOnReturn(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 bg-slate-950 border-slate-700"
                />
                <label htmlFor="markMaint" className="text-slate-300 text-xs cursor-pointer">
                  Mark this physical copy for <strong>MAINTENANCE</strong> (spine repair / bindery)
                </label>
              </div>

              <button
                type="submit"
                disabled={returnLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-950/40 text-sm"
              >
                {returnLoading ? 'Processing Return...' : 'Check In Book & Calculate Dues'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- 3. BOOKS & 8-DIGIT COPIES MANAGEMENT ---------------- */}
      {adminTab === 'BOOKS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Library Title Inventory &amp; Physical Copies</h3>
            <button
              onClick={() => setShowAddBookModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Book Title
            </button>
          </div>

          <div className="space-y-4">
            {books.map((book) => (
              <div key={book.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={book.coverUrl} alt={book.title} className="w-14 h-20 object-cover rounded-lg border border-slate-800" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{book.category}</span>
                      <h4 className="font-bold text-white text-base leading-snug">{book.title}</h4>
                      <p className="text-xs text-slate-400">by {book.author} &bull; Shelf: <strong className="text-emerald-300">{book.shelfNumber}</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAddCopyBookTitleId(book.id); setCustomCopyId(''); }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Physical Copy
                    </button>
                  </div>
                </div>

                {/* Copies list */}
                <div className="border border-slate-800/80 rounded-xl overflow-x-auto bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3 font-mono">8-Digit Book ID</th>
                        <th className="py-2 px-3">Copy #</th>
                        <th className="py-2 px-3">Condition</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Shelf</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {book.copies?.map((copy) => (
                        <tr key={copy.bookId} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono font-bold text-emerald-300">{copy.bookId}</td>
                          <td className="py-2 px-3 text-slate-400">Copy {copy.copyNumber}</td>
                          <td className="py-2 px-3 text-slate-300 capitalize">{copy.condition?.toLowerCase()}</td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              copy.status === 'AVAILABLE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : copy.status === 'OVERDUE'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : copy.status === 'MAINTENANCE'
                                ? 'bg-slate-700 text-slate-300'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {copy.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400">{copy.shelfNumber}</td>
                          <td className="py-2 px-3 text-right space-x-2">
                            <button
                              onClick={() => onOpenQR(copy, book.title, book.author)}
                              className="p-1 text-slate-400 hover:text-emerald-300"
                              title="Print Spine QR"
                            >
                              <QrCode className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleToggleMaintenance(copy)}
                              className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                            >
                              {copy.status === 'MAINTENANCE' ? 'Set Available' : 'Mark Maint.'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 4. STUDENT ACCOUNTS ---------------- */}
      {adminTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Enrolled Students &amp; Library Status</h3>
            <span className="text-xs text-slate-400">Total: {students.length} students</span>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-mono">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department &amp; Sem</th>
                  <th className="py-3 px-4">Active Loans</th>
                  <th className="py-3 px-4">Active Res.</th>
                  <th className="py-3 px-4">Pending Fine</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-300">{stu.rollNo}</td>
                    <td className="py-3 px-4 font-semibold text-white">{stu.name}</td>
                    <td className="py-3 px-4 text-slate-400">{stu.department} ({stu.semester})</td>
                    <td className="py-3 px-4 text-slate-300">{stu.activeLoansCount || 0} / {stu.maxBorrowLimit}</td>
                    <td className="py-3 px-4 text-slate-300">{stu.activeReservationsCount || 0}</td>
                    <td className="py-3 px-4">
                      {(stu.pendingFinesTotal || 0) > 0 ? (
                        <span className="text-rose-400 font-bold">₹{stu.pendingFinesTotal}</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        stu.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {stu.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStudentStatus(stu)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          stu.status === 'ACTIVE'
                            ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/80'
                            : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80'
                        }`}
                      >
                        {stu.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- 5. RESERVATIONS & WAITLIST ---------------- */}
      {adminTab === 'RESERVATIONS' && (
        <div className="space-y-6">
          {/* Active Reservations */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Active Online Book Reservations</h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-mono">Reservation ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4 font-mono">Copy ID</th>
                    <th className="py-3 px-4">Pickup Deadline</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-emerald-300 font-bold">{r.reservationId}</td>
                      <td className="py-3 px-4 font-medium text-white">{r.studentName} ({r.studentRollNo})</td>
                      <td className="py-3 px-4 text-slate-300">{r.bookTitle}</td>
                      <td className="py-3 px-4 font-mono text-teal-300 font-bold">{r.bookId}</td>
                      <td className="py-3 px-4 text-amber-300 font-medium">{new Date(r.pickupDeadline).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waitlist Queue */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Waitlist Queue (Chronological Order)</h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
              {waitlist.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No active students currently on waitlist.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Queue Position</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Joined At</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {waitlist.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-amber-400">Position #{w.position}</td>
                        <td className="py-3 px-4 font-semibold text-white">{w.bookTitle}</td>
                        <td className="py-3 px-4 text-slate-300">{w.studentName} ({w.studentRollNo})</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(w.joinedAt).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 6. FINES DESK ---------------- */}
      {adminTab === 'FINES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Overdue Fines &amp; Receipts Ledger</h3>
            <div className="text-xs text-slate-400">Formula: Overdue Days &times; ₹{settings?.finePerDayRupees || 5}/day</div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow">
            {fines.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No overdue fine records in the system.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4 font-mono">Book ID</th>
                    <th className="py-3 px-4">Overdue Days</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Receipt / Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {fines.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-medium text-white">{f.studentName} ({f.studentRollNo})</td>
                      <td className="py-3 px-4 text-slate-300">{f.bookTitle}</td>
                      <td className="py-3 px-4 font-mono text-emerald-300 font-bold">{f.bookId}</td>
                      <td className="py-3 px-4 text-rose-300 font-semibold">{f.overdueDays} days</td>
                      <td className="py-3 px-4 font-bold text-base text-white">₹{f.totalAmount}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : f.status === 'WAIVED'
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {f.status} {f.receiptNumber ? `(${f.receiptNumber})` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {f.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handlePayFine(f.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                            >
                              Collect Payment
                            </button>
                            <button
                              onClick={() => handleWaiveFine(f.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                            >
                              Waive
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 7. REPORTS & EXPORT ---------------- */}
      {adminTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Circulation Reports &amp; Analytics</h3>
              <p className="text-xs text-slate-400">Department metrics, category borrowing, and exportable CSV transactions</p>
            </div>

            <a
              href="/api/reports/export-csv"
              download="library-report.csv"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow"
            >
              <Download className="w-4 h-4" />
              Export Full Report to CSV
            </a>
          </div>

          {reportLoading ? (
            <div className="p-12 text-center text-slate-400">Loading reports data...</div>
          ) : reportsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Borrowed Books */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Most Borrowed Titles
                </h4>
                <div className="space-y-2">
                  {reportsData.mostBorrowedBooks?.map((b: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded-lg">
                      <span className="text-slate-200 font-medium truncate max-w-xs">{b.title}</span>
                      <span className="text-emerald-400 font-bold font-mono">{b.borrowCount} issues</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  Department-Wise Circulation
                </h4>
                <div className="space-y-2">
                  {reportsData.departmentStats?.map((d: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-950 rounded-lg">
                      <span className="text-slate-200 font-medium truncate max-w-xs">{d.department}</span>
                      <span className="text-teal-300 font-bold font-mono">{d.count} loans</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ---------------- 8. SETTINGS TAB ---------------- */}
      {adminTab === 'SETTINGS' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl max-w-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Settings className="w-5 h-5 text-emerald-400" />
            Library Borrowing &amp; Fine Policies
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Standard Borrowing Period (Days)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={editBorrowDays}
                onChange={(e) => setEditBorrowDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default is 14 days. Controls auto due-date calculation.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fine Per Overdue Day (₹)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editFineRate}
                onChange={(e) => setEditFineRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default is ₹5/day. Calculated securely by backend.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reservation Pickup Window (Hours)</label>
              <input
                type="number"
                min="12"
                max="168"
                value={editPickupHours}
                onChange={(e) => setEditPickupHours(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default is 48 hours before auto-expiry.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Max Borrow Limit Per Student (Books)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={editBorrowLimit}
                onChange={(e) => setEditBorrowLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={settingsLoading}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow"
            >
              {settingsLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* ---------------- 9. AUDIT TRAILS TAB ---------------- */}
      {adminTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Administrative Actions &amp; Audit Logs</h3>
            <span className="text-xs text-slate-400">Total: {auditLogs.length} events logged</span>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff / User</th>
                  <th className="py-3 px-4 font-mono">Action</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-300">{log.adminUsername}</td>
                    <td className="py-3 px-4 font-mono text-teal-300">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: ADD BOOK ---------------- */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-800">
              Add New Book Title &amp; Physical Copies
            </h3>

            {addBookError && (
              <div className="mb-4 p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl">
                {addBookError}
              </div>
            )}

            <form onSubmit={handleAddBookSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design and Analysis of Algorithms"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Author(s) *</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Sartaj Sahni"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ISBN *</label>
                  <input
                    type="text"
                    required
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="978-0..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shelf Number *</label>
                  <input
                    type="text"
                    required
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    placeholder="e.g. CS-C-09"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Physical Copies Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newCopiesCount}
                    onChange={(e) => setNewCopiesCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Optional: Specific 8-Digit Book IDs (comma-separated, exactly 8 digits each)
                </label>
                <input
                  type="text"
                  value={custom8DigitIdInput}
                  onChange={(e) => setCustom8DigitIdInput(e.target.value)}
                  placeholder="Leave empty to auto-generate unique 8-digit IDs, or e.g. 58274199, 58274200"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBookLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  {addBookLoading ? 'Creating...' : 'Add Book & Generate 8-Digit Barcodes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: ADD COPY ---------------- */}
      {addCopyBookTitleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-3">Add Physical Copy Record</h3>
            <form onSubmit={handleAddCopySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  8-Digit Book ID (Optional - leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={customCopyId}
                  onChange={(e) => setCustomCopyId(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 88392099"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Physical Condition</label>
                <select
                  value={copyCondition}
                  onChange={(e) => setCopyCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="FAIR">FAIR</option>
                  <option value="DAMAGED">DAMAGED</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddCopyBookTitleId(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Confirm &amp; Register Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
