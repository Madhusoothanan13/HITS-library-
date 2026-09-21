import {
  User,
  Student,
  Book,
  BookCopy,
  Reservation,
  BorrowTransaction,
  WaitlistEntry,
  FineRecord,
  LibraryNotification,
  LibrarySettings,
  AuditLog,
  DashboardStats
} from '../types.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('library_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.error) errorMsg = data.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// ---------------- AUTH API ----------------
export async function loginApi(username: string, password: string) {
  const data = await apiRequest<{ token: string; user: User; student?: Student | null }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  localStorage.setItem('library_auth_token', data.token);
  return data;
}

export async function registerStudentApi(payload: {
  rollNo: string;
  name: string;
  email: string;
  department: string;
  semester: string;
  phone: string;
  password: string;
}) {
  const data = await apiRequest<{ token: string; user: User; student: Student }>('/auth/register-student', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  localStorage.setItem('library_auth_token', data.token);
  return data;
}

export async function getMeApi() {
  return apiRequest<{ user: User; student?: Student | null }>('/auth/me');
}

export function logoutApi() {
  localStorage.removeItem('library_auth_token');
}

// ---------------- BOOKS API ----------------
export async function getBooksApi(params?: { q?: string; query?: string; category?: string; department?: string; availability?: string; availableOnly?: boolean }) {
  const query = new URLSearchParams();
  const searchQ = params?.q || params?.query;
  if (searchQ) query.set('q', searchQ);
  if (params?.category) query.set('category', params.category);
  if (params?.department) query.set('department', params.department);
  if (params?.availability) query.set('availability', params.availability);
  if (params?.availableOnly) query.set('availability', 'AVAILABLE');

  const qs = query.toString();
  return apiRequest<{ books: (Book & { copies: BookCopy[] })[] }>(`/books${qs ? `?${qs}` : ''}`);
}

export async function getBookByCopyIdApi(bookId: string) {
  return apiRequest<{ copy: BookCopy; book: Book; expectedReturnDate?: string | null; currentBorrower?: string | null }>(`/books/by-copy-id/${encodeURIComponent(bookId)}`);
}

export async function getBookByIdApi(id: string) {
  return apiRequest<{ book: Book & { copies: any[] }; waitlistCount: number }>(`/books/${id}`);
}

export async function addBookApi(payload: any) {
  return apiRequest<{ book: Book; copies: BookCopy[] }>('/books', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateBookApi(id: string, payload: any) {
  return apiRequest<{ book: Book }>(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function addCopyApi(bookTitleId: string, payload: { bookId?: string; condition?: string; shelfNumber?: string; location?: string }) {
  return apiRequest<{ copy: BookCopy }>(`/books/${bookTitleId}/copies`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateCopyApi(bookId: string, payload: { status?: string; condition?: string; notes?: string; shelfNumber?: string }) {
  return apiRequest<{ copy: BookCopy }>(`/books/copies/${bookId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

// ---------------- RESERVATION API ----------------
export async function createReservationApi(payload: { bookTitleId: string; bookId?: string; studentId?: string }) {
  return apiRequest<{ reservation: Reservation; copy: BookCopy }>('/reservations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getReservationsApi() {
  return apiRequest<{ reservations: Reservation[] }>('/reservations');
}

export async function cancelReservationApi(id: string) {
  return apiRequest<{ message: string; reservation: Reservation }>(`/reservations/${id}/cancel`, {
    method: 'POST'
  });
}

// ---------------- TRANSACTIONS & BORROWING API ----------------
export async function issueBookApi(payload: { studentRollNo: string; bookId: string }) {
  return apiRequest<{ transaction: BorrowTransaction; copy: BookCopy }>('/transactions/issue', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function returnBookApi(payload: { bookId: string; conditionNotes?: string; markMaintenance?: boolean }) {
  return apiRequest<{ message: string; transaction: BorrowTransaction; copy: BookCopy; overdueDays: number; fineAmount: number }>('/transactions/return', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getTransactionsApi(params?: { studentId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.studentId) query.set('studentId', params.studentId);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  return apiRequest<{ transactions: BorrowTransaction[] }>(`/transactions${qs ? `?${qs}` : ''}`);
}

// ---------------- WAITLIST API ----------------
export async function joinWaitlistApi(bookTitleId: string) {
  return apiRequest<{ waitlistEntry: WaitlistEntry }>('/waitlist/join', {
    method: 'POST',
    body: JSON.stringify({ bookTitleId })
  });
}

export async function getWaitlistApi() {
  return apiRequest<{ waitlist: WaitlistEntry[] }>('/waitlist');
}

// ---------------- FINES API ----------------
export async function getFinesApi() {
  return apiRequest<{ fines: FineRecord[] }>('/fines');
}

export async function payFineApi(id: string, paymentMethod?: string) {
  return apiRequest<{ fine: FineRecord }>(`/fines/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod })
  });
}

export async function waiveFineApi(id: string, reason?: string) {
  return apiRequest<{ fine: FineRecord }>(`/fines/${id}/waive`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

// ---------------- QR CODE API ----------------
export async function getBookQrCodeApi(bookId: string) {
  return apiRequest<{ qrDataUrl: string; payload: any }>(`/qr/book/${bookId}`);
}

// ---------------- RECOMMENDATIONS ----------------
export async function getRecommendationsApi() {
  return apiRequest<{ recommendations: { book: Book; score: number; reason: string; secondaryReason: string | null }[] }>('/recommendations');
}

// ---------------- NOTIFICATIONS ----------------
export async function getNotificationsApi() {
  return apiRequest<{ notifications: LibraryNotification[] }>('/notifications');
}

export async function markNotificationReadApi(id: string) {
  return apiRequest<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PATCH'
  });
}

export async function markAllNotificationsReadApi() {
  return apiRequest<{ success: boolean }>('/notifications/read-all', {
    method: 'PATCH'
  });
}

// ---------------- STUDENTS MANAGEMENT ----------------
export async function getStudentsApi() {
  return apiRequest<{ students: (Student & { activeLoansCount: number; activeReservationsCount: number; pendingFinesTotal: number })[] }>('/students');
}

export async function updateStudentStatusApi(id: string, status: 'ACTIVE' | 'SUSPENDED') {
  return apiRequest<{ student: Student }>(`/students/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

// ---------------- REPORTS & SETTINGS ----------------
export async function getReportsApi(startDate?: string, endDate?: string) {
  const query = new URLSearchParams();
  if (startDate) query.set('startDate', startDate);
  if (endDate) query.set('endDate', endDate);
  const qs = query.toString();
  return apiRequest<any>(`/reports${qs ? `?${qs}` : ''}`);
}

export async function getDashboardStatsApi() {
  return apiRequest<{ stats: DashboardStats }>('/dashboard/stats');
}

export async function getSettingsApi() {
  return apiRequest<{ settings: LibrarySettings }>('/settings');
}

export async function updateSettingsApi(settings: Partial<LibrarySettings>) {
  return apiRequest<{ settings: LibrarySettings }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
}

export async function getAuditLogsApi() {
  return apiRequest<{ auditLogs: AuditLog[] }>('/audit-logs');
}

export async function getCategoriesAndDepartmentsApi() {
  return apiRequest<{ categories: string[]; departments: string[] }>('/categories-departments');
}

export async function getBookBy8DigitIdApi(bookId: string) {
  return apiRequest<{ copy: BookCopy; book: Book & { copies: BookCopy[] }; expectedReturnDate?: string | null; currentBorrower?: string | null }>(`/books/by-copy-id/${encodeURIComponent(bookId)}`);
}

export async function getCategoriesApi() {
  const res = await getCategoriesAndDepartmentsApi();
  return { categories: res.categories };
}

export async function getDepartmentsApi() {
  const res = await getCategoriesAndDepartmentsApi();
  return { departments: res.departments };
}

export async function getStudentDashboardApi() {
  const me = await getMeApi();
  const [txnRes, resRes, fineRes, notifRes] = await Promise.all([
    getTransactionsApi({ studentId: me.student?.id }),
    getReservationsApi(),
    getFinesApi(),
    getNotificationsApi()
  ]);

  return {
    student: me.student!,
    transactions: txnRes.transactions || [],
    reservations: resRes.reservations || [],
    fines: fineRes.fines || [],
    notifications: notifRes.notifications || []
  };
}

export async function getAdminStatsApi() {
  return getDashboardStatsApi();
}

export async function getStudentsListApi() {
  return getStudentsApi();
}

export async function getAdminWaitlistApi() {
  return getWaitlistApi();
}

export async function getAdminSettingsApi() {
  return getSettingsApi();
}

