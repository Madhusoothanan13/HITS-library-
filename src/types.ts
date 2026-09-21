export type UserRole = 'STUDENT' | 'ADMIN';

export type BookStatus = 
  | 'AVAILABLE' 
  | 'RESERVED' 
  | 'ISSUED' 
  | 'DUE_SOON' 
  | 'OVERDUE' 
  | 'RETURNED' 
  | 'MAINTENANCE';

export type ReservationStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'READY_FOR_PICKUP' 
  | 'FULFILLED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type BorrowStatus = 
  | 'ACTIVE' 
  | 'RETURNED' 
  | 'OVERDUE';

export interface User {
  id: string;
  username: string; // rollNo for student, or 'admin'
  role: UserRole;
  name: string;
  email: string;
  studentId?: string; // Foreign key to Student if role === 'STUDENT'
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  department: string;
  semester: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  maxBorrowLimit: number;
  registeredAt: string;
  libraryCardNumber: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  edition: string;
  publisher: string;
  category: string;
  subject: string;
  department: string;
  description: string;
  coverUrl: string;
  shelfNumber: string;
  location: string;
  totalCopies: number;
  availableCopies: number;
  tags: string[];
}

export interface BookCopy {
  bookId: string; // EXACTLY 8-digit unique numeric ID, e.g. "58274103"
  bookTitleId: string; // Foreign key to Book
  copyNumber: number;
  status: BookStatus;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
  currentBorrowerStudentId?: string;
  currentReservationId?: string;
  shelfNumber: string;
  location: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  reservationId: string; // readable e.g. "RES-2026-001"
  studentId: string;
  studentRollNo: string;
  studentName: string;
  bookTitleId: string;
  bookTitle: string;
  bookId: string; // 8-digit physical book copy ID
  reservedAt: string;
  pickupDeadline: string; // ISO date string
  status: ReservationStatus;
  notes?: string;
}

export interface BorrowTransaction {
  id: string;
  transactionId: string; // e.g. "TXN-2026-001"
  studentId: string;
  studentRollNo: string;
  studentName: string;
  bookTitleId: string;
  bookTitle: string;
  bookId: string; // 8-digit physical copy ID
  issueDate: string; // ISO date
  dueDate: string; // ISO date
  returnDate?: string; // ISO date if returned
  status: BorrowStatus;
  overdueDays: number;
  fineAmount: number;
  finePaid: boolean;
  issuedBy: string; // Librarian name or username
  returnedTo?: string;
}

export interface WaitlistEntry {
  id: string;
  bookTitleId: string;
  bookTitle: string;
  studentId: string;
  studentRollNo: string;
  studentName: string;
  joinedAt: string;
  position: number;
  status: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  offeredAt?: string;
  pickupDeadline?: string;
  assignedBookId?: string;
}

export interface FineRecord {
  id: string;
  transactionId: string;
  studentId: string;
  studentRollNo: string;
  studentName: string;
  bookTitle: string;
  bookId: string;
  overdueDays: number;
  finePerDay: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'WAIVED';
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

export interface LibraryNotification {
  id: string;
  userId: string; // Student ID or 'ALL' or 'ADMIN'
  title: string;
  message: string;
  type: 
    | 'RESERVATION_SUCCESS' 
    | 'RESERVATION_APPROVED' 
    | 'READY_FOR_PICKUP' 
    | 'DUE_SOON' 
    | 'DUE_TOMORROW' 
    | 'DUE_TODAY' 
    | 'OVERDUE' 
    | 'FINE_GENERATED' 
    | 'WAITLIST_AVAILABLE' 
    | 'SYSTEM';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface LibrarySettings {
  standardBorrowPeriodDays: number; // e.g. 14 days
  finePerDayRupees: number; // e.g. ₹5
  pickupDeadlineHours: number; // e.g. 48 hours
  maxBorrowLimitPerStudent: number; // e.g. 3 books
  allowWaitlist: boolean;
  institutionName: string;
  libraryCode: string;
  contactEmail: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminUsername: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  reservedCopies: number;
  overdueCopies: number;
  totalStudents: number;
  activeReservations: number;
  pendingReturns: number;
  totalFinesPending: number;
  totalFinesCollected: number;
  activeWaitlistCount: number;
}
