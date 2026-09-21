import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header 
} from './components/Header.js';
import { 
  BookSearch 
} from './components/BookSearch.js';
import { 
  StudentDashboard 
} from './components/StudentDashboard.js';
import { 
  AdminDashboard 
} from './components/AdminDashboard.js';
import { 
  BookDetailsModal 
} from './components/BookDetailsModal.js';
import { 
  QRCodeModal 
} from './components/QRCodeModal.js';
import { 
  DigitalLibraryCardModal 
} from './components/DigitalLibraryCardModal.js';
import { 
  AuthModal 
} from './components/AuthModal.js';
import { 
  User, 
  Student, 
  Book, 
  BookCopy, 
  BorrowTransaction, 
  Reservation, 
  FineRecord, 
  LibraryNotification, 
  DashboardStats, 
  WaitlistEntry, 
  LibrarySettings, 
  AuditLog 
} from './types.js';
import {
  getBooksApi,
  getBookBy8DigitIdApi,
  getCategoriesApi,
  getDepartmentsApi,
  getStudentDashboardApi,
  getAdminStatsApi,
  getStudentsListApi,
  getAdminWaitlistApi,
  getAdminSettingsApi,
  getAuditLogsApi,
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  loginApi,
  logoutApi,
  getMeApi
} from './services/api.js';
import { 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Search,
  BookmarkCheck
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'STUDENT_DASHBOARD' | 'MY_BOOKS' | 'ADMIN_DASHBOARD'>('SEARCH');

  // Authentication & Profile
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Catalog State
  const [books, setBooks] = useState<(Book & { copies: BookCopy[] })[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  // Student circulation records
  const [studentTransactions, setStudentTransactions] = useState<BorrowTransaction[]>([]);
  const [studentReservations, setStudentReservations] = useState<Reservation[]>([]);
  const [studentFines, setStudentFines] = useState<FineRecord[]>([]);

  // Admin Data
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [adminStudents, setAdminStudents] = useState<(Student & { activeLoansCount?: number })[]>([]);
  const [adminWaitlist, setAdminWaitlist] = useState<WaitlistEntry[]>([]);
  const [adminSettings, setAdminSettings] = useState<LibrarySettings | null>(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLog[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<LibraryNotification[]>([]);

  // Modals state
  const [selectedBook, setSelectedBook] = useState<(Book & { copies: BookCopy[] }) | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // QR Modal
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    bookId: string;
    bookTitle: string;
    author: string;
    shelfNumber: string;
    location: string;
    status: string;
  }>({
    isOpen: false,
    bookId: '',
    bookTitle: '',
    author: '',
    shelfNumber: '',
    location: '',
    status: ''
  });

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4500);
  };

  // 1. Initial Load of Catalog & Filters
  const loadCatalog = useCallback(async () => {
    try {
      const data = await getBooksApi({
        query: searchQuery || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        department: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
        availableOnly: availabilityFilter === 'AVAILABLE' ? true : undefined
      });

      let filtered = data.books || [];
      if (availabilityFilter === 'UNAVAILABLE') {
        filtered = filtered.filter((b: any) => b.availableCopies === 0);
      }

      setBooks(filtered);
    } catch (err) {
      console.error('Failed to load books catalog', err);
    }
  }, [searchQuery, selectedCategory, selectedDepartment, availabilityFilter]);

  const loadMetadata = async () => {
    try {
      const [cats, depts] = await Promise.all([
        getCategoriesApi(),
        getDepartmentsApi()
      ]);
      setCategories(cats.categories || []);
      setDepartments(depts.departments || []);
    } catch (err) {
      console.error('Failed to load categories/departments', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      setNotifications(res.notifications || []);
    } catch {
      // not logged in or ignored
    }
  };

  // Student specific data
  const loadStudentDashboard = async () => {
    try {
      const res = await getStudentDashboardApi();
      setStudent(res.student);
      setStudentTransactions(res.transactions || []);
      setStudentReservations(res.reservations || []);
      setStudentFines(res.fines || []);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    }
  };

  // Admin specific data
  const loadAdminData = async () => {
    try {
      const [statsRes, stuRes, waitRes, setRes, logsRes] = await Promise.all([
        getAdminStatsApi(),
        getStudentsListApi(),
        getAdminWaitlistApi(),
        getAdminSettingsApi(),
        getAuditLogsApi()
      ]);
      setAdminStats(statsRes.stats);
      setAdminStudents(stuRes.students || []);
      setAdminWaitlist(waitRes.waitlist || []);
      setAdminSettings(setRes.settings);
      setAdminAuditLogs(logsRes.auditLogs || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    }
  };

  // Initial check of logged in user
  useEffect(() => {
    loadMetadata();
    getMeApi()
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.student) setStudent(data.student);
        }
      })
      .catch(() => {})
      .finally(() => {
        loadCatalog();
      });
  }, []);

  // Reload catalog when filters change
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Load role-specific data when user changes or tab changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      if (user.role === 'STUDENT') {
        loadStudentDashboard();
      } else if (user.role === 'ADMIN') {
        loadAdminData();
      }
    }
  }, [user, activeTab]);

  // Handle direct 8-digit search
  const handleDirect8DigitSearch = async (eightDigitId: string) => {
    try {
      const res = await getBookBy8DigitIdApi(eightDigitId);
      if (res.book) {
        setSelectedBook(res.book);
        setIsBookModalOpen(true);
        showToast(`Found exact physical copy match: Book ID ${eightDigitId} ("${res.book.title}")`);
      }
    } catch (err: any) {
      showToast(`No physical book found matching 8-digit ID: ${eightDigitId}`);
      // Fallback: also put into search input
      setSearchQuery(eightDigitId);
    }
  };

  const handleSelectBook = (book: Book & { copies: BookCopy[] }) => {
    setSelectedBook(book);
    setIsBookModalOpen(true);
  };

  const handleSelectBookByTitleId = (titleId: string) => {
    const found = books.find(b => b.id === titleId);
    if (found) {
      setSelectedBook(found);
      setIsBookModalOpen(true);
    } else {
      getBooksApi({ query: titleId }).then(res => {
        if (res.books && res.books[0]) {
          setSelectedBook(res.books[0]);
          setIsBookModalOpen(true);
        }
      });
    }
  };

  const handleOpenQR = (copy: BookCopy, bookTitle: string, author: string) => {
    setQrModalData({
      isOpen: true,
      bookId: copy.bookId,
      bookTitle,
      author,
      shelfNumber: copy.shelfNumber,
      location: copy.shelfNumber,
      status: copy.status
    });
  };

  const handleAuthSuccess = (data: any) => {
    setUser(data.user);
    if (data.student) {
      setStudent(data.student);
      setActiveTab('STUDENT_DASHBOARD');
      showToast(`Welcome, ${data.student.name}! Student session activated.`);
    } else if (data.user.role === 'ADMIN') {
      setActiveTab('ADMIN_DASHBOARD');
      showToast(`Welcome, Librarian Admin! Circulation desk ready.`);
    }
    loadCatalog();
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      setUser(null);
      setStudent(null);
      setActiveTab('SEARCH');
      showToast('Logged out successfully.');
      loadCatalog();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickDemoSwitch = async (role: 'STUDENT' | 'ADMIN') => {
    try {
      if (role === 'ADMIN') {
        const data = await loginApi('admin', 'admin123');
        handleAuthSuccess(data);
      } else {
        const data = await loginApi('24MCA01', 'student123');
        handleAuthSuccess(data);
      }
    } catch (err: any) {
      showToast(err.message || 'Quick login switch failed');
    }
  };

  const handleRefreshAll = () => {
    loadCatalog();
    if (user?.role === 'STUDENT') loadStudentDashboard();
    if (user?.role === 'ADMIN') loadAdminData();
    showToast('Database records synchronized.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 border border-emerald-500 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="flex-1 leading-snug">{toastMessage}</p>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        user={user}
        student={student}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as any)}
        notifications={notifications}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onQuickDemoSwitch={handleQuickDemoSwitch}
        onOpenLibraryCard={() => setIsCardModalOpen(true)}
      />

      {/* Sub-bar / Quick Breadcrumbs & Role Indicator */}
      <div className="bg-[#0b1424] border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">Hindustan Institute of Technology &amp; Science (HITS)</span>
            <span>&bull;</span>
            <span className="text-slate-300 font-medium hidden sm:inline">Dr. K.C.G. Verghese Research &amp; Resource Centre</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="font-mono text-[11px] text-emerald-400">8-Digit Physical Book ID Catalog</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#009D4E] animate-pulse"></span>
                <span>Active: <strong>{user.role}</strong> ({user.username})</span>
              </span>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
              >
                Sign in to reserve books &amp; view digital card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'SEARCH' && (
          <BookSearch
            books={books}
            categories={categories}
            departments={departments}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            availabilityFilter={availabilityFilter}
            setAvailabilityFilter={setAvailabilityFilter}
            onSelectBook={handleSelectBook}
            onOpenQR={handleOpenQR}
            onDirect8DigitSearch={handleDirect8DigitSearch}
          />
        )}

        {activeTab === 'STUDENT_DASHBOARD' && student && (
          <StudentDashboard
            student={student}
            transactions={studentTransactions}
            reservations={studentReservations}
            fines={studentFines}
            notifications={notifications}
            onSelectBookByTitleId={handleSelectBookByTitleId}
            onOpenLibraryCard={() => setIsCardModalOpen(true)}
            onActionSuccess={(msg) => {
              showToast(msg);
              handleRefreshAll();
            }}
            onOpenQR={handleOpenQR}
          />
        )}

        {activeTab === 'MY_BOOKS' && student && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                My Borrowed Books &amp; Reservations
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Overview of books currently checked out or ready for pickup at the circulation desk.
              </p>
            </div>

            <StudentDashboard
              student={student}
              transactions={studentTransactions}
              reservations={studentReservations}
              fines={studentFines}
              notifications={notifications}
              onSelectBookByTitleId={handleSelectBookByTitleId}
              onOpenLibraryCard={() => setIsCardModalOpen(true)}
              onActionSuccess={(msg) => {
                showToast(msg);
                handleRefreshAll();
              }}
              onOpenQR={handleOpenQR}
            />
          </div>
        )}

        {activeTab === 'ADMIN_DASHBOARD' && user?.role === 'ADMIN' && (
          <AdminDashboard
            stats={adminStats}
            books={books}
            students={adminStudents}
            reservations={studentReservations}
            transactions={studentTransactions}
            fines={studentFines}
            waitlist={adminWaitlist}
            settings={adminSettings}
            auditLogs={adminAuditLogs}
            categories={categories}
            departments={departments}
            onRefreshData={handleRefreshAll}
            onOpenQR={handleOpenQR}
            onActionSuccess={(msg) => {
              showToast(msg);
              handleRefreshAll();
            }}
          />
        )}

        {/* Fallback for unauthenticated clicks on tabs */}
        {(activeTab === 'STUDENT_DASHBOARD' || activeTab === 'MY_BOOKS') && !student && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto">
            <GraduationCap className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Student Sign In Required</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Please sign in with your student credentials or register to view your borrowed books, active reservations, and due date countdowns.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              Sign In / Register Now
            </button>
          </div>
        )}

        {activeTab === 'ADMIN_DASHBOARD' && user?.role !== 'ADMIN' && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto">
            <ShieldCheck className="w-12 h-12 text-teal-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Librarian Access Required</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Please sign in with administrator credentials (Username: <code>admin</code> / Password: <code>admin123</code>) to access circulation, book issuance, and reporting.
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              Librarian Login (admin / admin123)
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#09111c] py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <span>Hindustan Institute of Technology &amp; Science</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Deemed University</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Dr. K.C.G. Verghese Research &amp; Resource Centre (Central Library) &bull; Founder's Block, Padur, Chennai - 603 103
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">14-Day Student Quota</span>
            <span>&bull;</span>
            <span className="text-amber-300 font-medium">₹5/Day Overdue Fine</span>
            <span>&bull;</span>
            <span className="text-slate-300 font-mono">8-Digit Physical IDs</span>
            <span>&bull;</span>
            <a
              href="https://hindustanuniv.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-white underline"
            >
              Official Website
            </a>
          </div>
        </div>
      </footer>

      {/* Book Details & Circulation Modal */}
      <BookDetailsModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        book={selectedBook}
        user={user}
        student={student}
        onOpenQR={handleOpenQR}
        onActionSuccess={(msg) => {
          showToast(msg);
          handleRefreshAll();
        }}
        onNeedLogin={() => {
          setIsBookModalOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Physical Book Spine QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData(prev => ({ ...prev, isOpen: false }))}
        bookId={qrModalData.bookId}
        bookTitle={qrModalData.bookTitle}
        author={qrModalData.author}
        shelfNumber={qrModalData.shelfNumber}
        location={qrModalData.location}
        status={qrModalData.status}
      />

      {/* Student Digital Library Card Modal */}
      {student && (
        <DigitalLibraryCardModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          student={student}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        departments={departments}
      />
    </div>
  );
}
