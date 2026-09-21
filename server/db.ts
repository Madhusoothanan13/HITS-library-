import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  DashboardStats,
  BookStatus
} from '../src/types.js';

interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  students: Student[];
  books: Book[];
  book_copies: BookCopy[];
  categories: string[];
  departments: string[];
  reservations: Reservation[];
  borrow_transactions: BorrowTransaction[];
  waitlist: WaitlistEntry[];
  fines: FineRecord[];
  notifications: LibraryNotification[];
  library_settings: LibrarySettings;
  audit_logs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'library_db.json');

// Password helper using Node's crypto
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

// Generate unique 8-digit Book ID helper
export function generateRandom8DigitId(existingIds: Set<string>): string {
  let id = '';
  do {
    id = Math.floor(10000000 + Math.random() * 90000000).toString();
  } while (existingIds.has(id));
  return id;
}

export function isValid8DigitId(id: string): boolean {
  return /^\d{8}$/.test(id.trim());
}

let dbCache: DatabaseSchema | null = null;

function getInitialData(): DatabaseSchema {
  const adminCreds = hashPassword('admin123');
  const studentCreds1 = hashPassword('student123');
  const studentCreds2 = hashPassword('student123');

  const categories = [
    'Computer Science',
    'Data Science & AI',
    'Information Technology',
    'Mathematics',
    'Electronics & Communication',
    'Management Studies',
    'Cloud Computing',
    'Cyber Security'
  ];

  const departments = [
    'Master of Computer Applications (MCA)',
    'Computer Science & Engineering (CSE)',
    'Information Technology (IT)',
    'Artificial Intelligence & Data Science',
    'Electronics & Comm. Eng (ECE)',
    'MBA'
  ];

  const students: Student[] = [
    {
      id: 'stu-001',
      rollNo: '24MCA01',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@college.edu',
      department: 'Master of Computer Applications (MCA)',
      semester: 'Semester 3',
      phone: '+91 98765 43210',
      status: 'ACTIVE',
      maxBorrowLimit: 3,
      registeredAt: '2025-08-10T09:00:00.000Z',
      libraryCardNumber: 'LIB-24MCA01-8821'
    },
    {
      id: 'stu-002',
      rollNo: '24MCA02',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@college.edu',
      department: 'Master of Computer Applications (MCA)',
      semester: 'Semester 3',
      phone: '+91 98765 43211',
      status: 'ACTIVE',
      maxBorrowLimit: 3,
      registeredAt: '2025-08-10T10:15:00.000Z',
      libraryCardNumber: 'LIB-24MCA02-9932'
    },
    {
      id: 'stu-003',
      rollNo: '23CSE45',
      name: 'Arjun Menon',
      email: 'arjun.menon@college.edu',
      department: 'Computer Science & Engineering (CSE)',
      semester: 'Semester 5',
      phone: '+91 98765 43212',
      status: 'ACTIVE',
      maxBorrowLimit: 3,
      registeredAt: '2024-07-20T11:00:00.000Z',
      libraryCardNumber: 'LIB-23CSE45-1209'
    }
  ];

  const users: (User & { passwordHash: string; salt: string })[] = [
    {
      id: 'usr-admin',
      username: 'admin',
      role: 'ADMIN',
      name: 'Chief Librarian Admin',
      email: 'librarian@college.edu',
      passwordHash: adminCreds.hash,
      salt: adminCreds.salt
    },
    {
      id: 'usr-stu-001',
      username: '24MCA01',
      role: 'STUDENT',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@college.edu',
      studentId: 'stu-001',
      passwordHash: studentCreds1.hash,
      salt: studentCreds1.salt
    },
    {
      id: 'usr-stu-002',
      username: '24MCA02',
      role: 'STUDENT',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@college.edu',
      studentId: 'stu-002',
      passwordHash: studentCreds2.hash,
      salt: studentCreds2.salt
    }
  ];

  const books: Book[] = [
    {
      id: 'book-001',
      title: 'Database System Concepts',
      author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
      isbn: '978-0078022159',
      edition: '7th Edition',
      publisher: 'McGraw-Hill Education',
      category: 'Computer Science',
      subject: 'Relational DBMS & SQL Optimization',
      department: 'Master of Computer Applications (MCA)',
      description: 'Comprehensive fundamentals of database management, relational algebra, SQL, transactions, concurrency, and indexing.',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      shelfNumber: 'CS-A-12',
      location: 'Floor 2, Section A, Rack 12',
      totalCopies: 3,
      availableCopies: 1,
      tags: ['DBMS', 'SQL', 'Database', 'Transactions']
    },
    {
      id: 'book-002',
      title: 'Introduction to Algorithms (CLRS)',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      isbn: '978-0262033848',
      edition: '3rd Edition',
      publisher: 'MIT Press',
      category: 'Computer Science',
      subject: 'Data Structures and Algorithm Design',
      department: 'Master of Computer Applications (MCA)',
      description: 'The standard text on algorithm design and analysis, covering dynamic programming, graph algorithms, NP-completeness, and greedy methods.',
      coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
      shelfNumber: 'CS-B-04',
      location: 'Floor 2, Section B, Rack 04',
      totalCopies: 2,
      availableCopies: 1,
      tags: ['Algorithms', 'Data Structures', 'Graphs', 'CLRS']
    },
    {
      id: 'book-003',
      title: 'Operating System Concepts (Dinosaur Book)',
      author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
      isbn: '978-1118063330',
      edition: '10th Edition',
      publisher: 'Wiley',
      category: 'Computer Science',
      subject: 'Operating Systems & System Architecture',
      department: 'Master of Computer Applications (MCA)',
      description: 'Explores processes, threads, memory virtualization, CPU scheduling, synchronization primitives, deadlocks, and distributed systems.',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      shelfNumber: 'CS-A-08',
      location: 'Floor 2, Section A, Rack 08',
      totalCopies: 2,
      availableCopies: 0,
      tags: ['OS', 'Linux', 'Memory Management', 'Processes']
    },
    {
      id: 'book-004',
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell, Peter Norvig',
      isbn: '978-0134610993',
      edition: '4th Edition',
      publisher: 'Pearson',
      category: 'Data Science & AI',
      subject: 'Foundations of Intelligent Agents',
      department: 'Artificial Intelligence & Data Science',
      description: 'The authoritative source on artificial intelligence covering search methods, probabilistic reasoning, reinforcement learning, and neural nets.',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      shelfNumber: 'AI-C-01',
      location: 'Floor 3, Section C, Rack 01',
      totalCopies: 2,
      availableCopies: 1,
      tags: ['AI', 'Machine Learning', 'Search', 'Neural Networks']
    },
    {
      id: 'book-005',
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James F. Kurose, Keith W. Ross',
      isbn: '978-0133594140',
      edition: '8th Edition',
      publisher: 'Pearson',
      category: 'Computer Science',
      subject: 'Network Protocols & Architecture',
      department: 'Information Technology (IT)',
      description: 'Top-down structure examining application layer protocols (HTTP, DNS), transport (TCP/UDP), network routing (BGP, OSPF), and data link security.',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      shelfNumber: 'IT-D-06',
      location: 'Floor 2, Section D, Rack 06',
      totalCopies: 2,
      availableCopies: 2,
      tags: ['Networking', 'TCP/IP', 'Routing', 'Security']
    },
    {
      id: 'book-006',
      title: 'Cloud Computing: Concepts, Technology & Architecture',
      author: 'Thomas Erl, Ricardo Puttini, Zaigham Mahmood',
      isbn: '978-0133387520',
      edition: '1st Edition',
      publisher: 'Prentice Hall',
      category: 'Cloud Computing',
      subject: 'Distributed Cloud Architecture & Microservices',
      department: 'Master of Computer Applications (MCA)',
      description: 'Covers cloud models (IaaS, PaaS, SaaS), virtualization mechanisms, serverless architecture, load balancing, and cloud security frameworks.',
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      shelfNumber: 'CC-E-02',
      location: 'Floor 3, Section E, Rack 02',
      totalCopies: 2,
      availableCopies: 2,
      tags: ['Cloud', 'AWS', 'Microservices', 'Distributed Systems']
    }
  ];

  // Physical copies with exactly 8-digit unique Book IDs
  const book_copies: BookCopy[] = [
    // Book 001 (Database System Concepts)
    {
      bookId: '58274103',
      bookTitleId: 'book-001',
      copyNumber: 1,
      status: 'ISSUED',
      condition: 'EXCELLENT',
      currentBorrowerStudentId: 'stu-001',
      shelfNumber: 'CS-A-12',
      location: 'Floor 2, Section A, Rack 12'
    },
    {
      bookId: '58274104',
      bookTitleId: 'book-001',
      copyNumber: 2,
      status: 'RESERVED',
      condition: 'GOOD',
      currentReservationId: 'res-001',
      shelfNumber: 'CS-A-12',
      location: 'Floor 2, Section A, Rack 12'
    },
    {
      bookId: '58274105',
      bookTitleId: 'book-001',
      copyNumber: 3,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: 'CS-A-12',
      location: 'Floor 2, Section A, Rack 12'
    },
    // Book 002 (Introduction to Algorithms)
    {
      bookId: '19482031',
      bookTitleId: 'book-002',
      copyNumber: 1,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: 'CS-B-04',
      location: 'Floor 2, Section B, Rack 04'
    },
    {
      bookId: '19482032',
      bookTitleId: 'book-002',
      copyNumber: 2,
      status: 'OVERDUE',
      condition: 'GOOD',
      currentBorrowerStudentId: 'stu-001',
      shelfNumber: 'CS-B-04',
      location: 'Floor 2, Section B, Rack 04'
    },
    // Book 003 (Operating System Concepts)
    {
      bookId: '43920194',
      bookTitleId: 'book-003',
      copyNumber: 1,
      status: 'ISSUED',
      condition: 'EXCELLENT',
      currentBorrowerStudentId: 'stu-002',
      shelfNumber: 'CS-A-08',
      location: 'Floor 2, Section A, Rack 08'
    },
    {
      bookId: '43920195',
      bookTitleId: 'book-003',
      copyNumber: 2,
      status: 'MAINTENANCE',
      condition: 'FAIR',
      shelfNumber: 'CS-A-08',
      location: 'Floor 2, Section A, Rack 08',
      notes: 'Spine repair underway in bindery'
    },
    // Book 004 (Artificial Intelligence)
    {
      bookId: '77291048',
      bookTitleId: 'book-004',
      copyNumber: 1,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: 'AI-C-01',
      location: 'Floor 3, Section C, Rack 01'
    },
    {
      bookId: '77291049',
      bookTitleId: 'book-004',
      copyNumber: 2,
      status: 'ISSUED',
      condition: 'GOOD',
      currentBorrowerStudentId: 'stu-003',
      shelfNumber: 'AI-C-01',
      location: 'Floor 3, Section C, Rack 01'
    },
    // Book 005 (Computer Networking)
    {
      bookId: '88392014',
      bookTitleId: 'book-005',
      copyNumber: 1,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: 'IT-D-06',
      location: 'Floor 2, Section D, Rack 06'
    },
    {
      bookId: '88392015',
      bookTitleId: 'book-005',
      copyNumber: 2,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: 'IT-D-06',
      location: 'Floor 2, Section D, Rack 06'
    },
    // Book 006 (Cloud Computing)
    {
      bookId: '62910482',
      bookTitleId: 'book-006',
      copyNumber: 1,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: 'CC-E-02',
      location: 'Floor 3, Section E, Rack 02'
    },
    {
      bookId: '62910483',
      bookTitleId: 'book-006',
      copyNumber: 2,
      status: 'AVAILABLE',
      condition: 'GOOD',
      shelfNumber: 'CC-E-02',
      location: 'Floor 3, Section E, Rack 02'
    }
  ];

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();
  const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

  const reservations: Reservation[] = [
    {
      id: 'res-001',
      reservationId: 'RES-2026-001',
      studentId: 'stu-002',
      studentRollNo: '24MCA02',
      studentName: 'Priya Sundaram',
      bookTitleId: 'book-001',
      bookTitle: 'Database System Concepts',
      bookId: '58274104',
      reservedAt: daysAgo(1),
      pickupDeadline: hoursAhead(36),
      status: 'READY_FOR_PICKUP',
      notes: 'Reserved online via portal'
    }
  ];

  const borrow_transactions: BorrowTransaction[] = [
    {
      id: 'txn-001',
      transactionId: 'TXN-2026-101',
      studentId: 'stu-001',
      studentRollNo: '24MCA01',
      studentName: 'Rahul Sharma',
      bookTitleId: 'book-001',
      bookTitle: 'Database System Concepts',
      bookId: '58274103',
      issueDate: daysAgo(5),
      dueDate: daysAhead(9), // 9 days remaining
      status: 'ACTIVE',
      overdueDays: 0,
      fineAmount: 0,
      finePaid: true,
      issuedBy: 'Chief Librarian Admin'
    },
    {
      id: 'txn-002',
      transactionId: 'TXN-2026-089',
      studentId: 'stu-001',
      studentRollNo: '24MCA01',
      studentName: 'Rahul Sharma',
      bookTitleId: 'book-002',
      bookTitle: 'Introduction to Algorithms (CLRS)',
      bookId: '19482032',
      issueDate: daysAgo(17),
      dueDate: daysAgo(3), // overdue by 3 days!
      status: 'OVERDUE',
      overdueDays: 3,
      fineAmount: 15, // 3 days * ₹5 = ₹15
      finePaid: false,
      issuedBy: 'Chief Librarian Admin'
    },
    {
      id: 'txn-003',
      transactionId: 'TXN-2026-095',
      studentId: 'stu-002',
      studentRollNo: '24MCA02',
      studentName: 'Priya Sundaram',
      bookTitleId: 'book-003',
      bookTitle: 'Operating System Concepts (Dinosaur Book)',
      bookId: '43920194',
      issueDate: daysAgo(3),
      dueDate: daysAhead(11),
      status: 'ACTIVE',
      overdueDays: 0,
      fineAmount: 0,
      finePaid: true,
      issuedBy: 'Chief Librarian Admin'
    },
    {
      id: 'txn-004',
      transactionId: 'TXN-2026-070',
      studentId: 'stu-003',
      studentRollNo: '23CSE45',
      studentName: 'Arjun Menon',
      bookTitleId: 'book-004',
      bookTitle: 'Artificial Intelligence: A Modern Approach',
      bookId: '77291049',
      issueDate: daysAgo(4),
      dueDate: daysAhead(10),
      status: 'ACTIVE',
      overdueDays: 0,
      fineAmount: 0,
      finePaid: true,
      issuedBy: 'Chief Librarian Admin'
    },
    {
      id: 'txn-005',
      transactionId: 'TXN-2026-042',
      studentId: 'stu-001',
      studentRollNo: '24MCA01',
      studentName: 'Rahul Sharma',
      bookTitleId: 'book-005',
      bookTitle: 'Computer Networking: A Top-Down Approach',
      bookId: '88392014',
      issueDate: daysAgo(30),
      dueDate: daysAgo(16),
      returnDate: daysAgo(16),
      status: 'RETURNED',
      overdueDays: 0,
      fineAmount: 0,
      finePaid: true,
      issuedBy: 'Chief Librarian Admin',
      returnedTo: 'Chief Librarian Admin'
    }
  ];

  const waitlist: WaitlistEntry[] = [
    {
      id: 'wt-001',
      bookTitleId: 'book-003',
      bookTitle: 'Operating System Concepts (Dinosaur Book)',
      studentId: 'stu-001',
      studentRollNo: '24MCA01',
      studentName: 'Rahul Sharma',
      joinedAt: daysAgo(2),
      position: 1,
      status: 'WAITING'
    }
  ];

  const fines: FineRecord[] = [
    {
      id: 'fn-001',
      transactionId: 'txn-002',
      studentId: 'stu-001',
      studentRollNo: '24MCA01',
      studentName: 'Rahul Sharma',
      bookTitle: 'Introduction to Algorithms (CLRS)',
      bookId: '19482032',
      overdueDays: 3,
      finePerDay: 5,
      totalAmount: 15,
      status: 'PENDING',
      createdAt: daysAgo(1)
    }
  ];

  const notifications: LibraryNotification[] = [
    {
      id: 'notif-001',
      userId: 'stu-001',
      title: 'Book Overdue Notice',
      message: 'Your borrowed book "Introduction to Algorithms (CLRS)" [Book ID: 19482032] is 3 days overdue. Accrued fine: ₹15.',
      type: 'OVERDUE',
      read: false,
      createdAt: daysAgo(1)
    },
    {
      id: 'notif-002',
      userId: 'stu-001',
      title: 'Book Borrowed Successfully',
      message: 'You have borrowed "Database System Concepts" [Book ID: 58274103]. Due date is 9 days away.',
      type: 'SYSTEM',
      read: true,
      createdAt: daysAgo(5)
    },
    {
      id: 'notif-003',
      userId: 'stu-002',
      title: 'Reservation Ready for Pickup',
      message: 'Your reservation for "Database System Concepts" [Book ID: 58274104] is ready at Counter 1. Pickup within 36 hours.',
      type: 'READY_FOR_PICKUP',
      read: false,
      createdAt: daysAgo(1)
    }
  ];

  const library_settings: LibrarySettings = {
    standardBorrowPeriodDays: 14,
    finePerDayRupees: 5,
    pickupDeadlineHours: 48,
    maxBorrowLimitPerStudent: 3,
    allowWaitlist: true,
    institutionName: 'Apex Institute of Technology & Management - Central Library',
    libraryCode: 'AITM-LIB-MAIN',
    contactEmail: 'library@college.edu'
  };

  const audit_logs: AuditLog[] = [
    {
      id: 'log-001',
      timestamp: daysAgo(5),
      adminUsername: 'admin',
      action: 'BOOK_ISSUED',
      details: 'Issued Book ID 58274103 to student 24MCA01 (Rahul Sharma).'
    },
    {
      id: 'log-002',
      timestamp: daysAgo(1),
      adminUsername: 'admin',
      action: 'RESERVATION_APPROVED',
      details: 'Approved reservation RES-2026-001 for Priya Sundaram (Book ID: 58274104).'
    },
    {
      id: 'log-003',
      timestamp: daysAgo(1),
      adminUsername: 'SYSTEM',
      action: 'OVERDUE_FINE_CALCULATED',
      details: 'Accrued fine of ₹15 generated for student 24MCA01 on Book ID 19482032.'
    }
  ];

  return {
    users,
    students,
    books,
    book_copies,
    categories,
    departments,
    reservations,
    borrow_transactions,
    waitlist,
    fines,
    notifications,
    library_settings,
    audit_logs
  };
}

export function getDb(): DatabaseSchema {
  if (dbCache) {
    refreshDynamicStatuses(dbCache);
    return dbCache;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
    } else {
      dbCache = getInitialData();
      saveDb();
    }
  } catch (err) {
    console.error('Error reading DB, resetting to defaults:', err);
    dbCache = getInitialData();
    saveDb();
  }

  if (dbCache) {
    refreshDynamicStatuses(dbCache);
  }
  return dbCache!;
}

export function saveDb(): void {
  if (!dbCache) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

// Automatically recalculate overdue days, fines, and copy availability
export function refreshDynamicStatuses(db: DatabaseSchema): void {
  const now = new Date();
  const finePerDay = db.library_settings.finePerDayRupees;

  // 1. Process active transactions
  for (const txn of db.borrow_transactions) {
    if (txn.status !== 'RETURNED') {
      const dueDate = new Date(txn.dueDate);
      const diffMs = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays > 0) {
        txn.overdueDays = diffDays;
        txn.status = 'OVERDUE';
        txn.fineAmount = diffDays * finePerDay;

        // Update corresponding copy status
        const copy = db.book_copies.find(c => c.bookId === txn.bookId);
        if (copy && copy.status !== 'MAINTENANCE') {
          copy.status = 'OVERDUE';
        }

        // Check if fine record exists
        let fine = db.fines.find(f => f.transactionId === txn.id && f.status === 'PENDING');
        if (!fine) {
          fine = {
            id: `fn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            transactionId: txn.id,
            studentId: txn.studentId,
            studentRollNo: txn.studentRollNo,
            studentName: txn.studentName,
            bookTitle: txn.bookTitle,
            bookId: txn.bookId,
            overdueDays: diffDays,
            finePerDay: finePerDay,
            totalAmount: txn.fineAmount,
            status: 'PENDING',
            createdAt: now.toISOString()
          };
          db.fines.push(fine);
        } else {
          fine.overdueDays = diffDays;
          fine.finePerDay = finePerDay;
          fine.totalAmount = txn.fineAmount;
        }
      } else {
        txn.overdueDays = 0;
        const daysLeft = Math.ceil(-diffMs / 86400000);
        if (daysLeft <= 3) {
          txn.status = 'ACTIVE';
          const copy = db.book_copies.find(c => c.bookId === txn.bookId);
          if (copy && copy.status !== 'MAINTENANCE') {
            copy.status = 'DUE_SOON';
          }
        } else {
          txn.status = 'ACTIVE';
          const copy = db.book_copies.find(c => c.bookId === txn.bookId);
          if (copy && copy.status !== 'MAINTENANCE') {
            copy.status = 'ISSUED';
          }
        }
      }
    }
  }

  // 2. Process expired reservations
  for (const res of db.reservations) {
    if (res.status === 'READY_FOR_PICKUP' || res.status === 'APPROVED' || res.status === 'PENDING') {
      const deadline = new Date(res.pickupDeadline);
      if (now.getTime() > deadline.getTime()) {
        res.status = 'EXPIRED';
        // Free the copy
        const copy = db.book_copies.find(c => c.bookId === res.bookId);
        if (copy && copy.status === 'RESERVED') {
          copy.status = 'AVAILABLE';
          copy.currentReservationId = undefined;
        }

        // Notify student
        db.notifications.push({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: res.studentId,
          title: 'Reservation Expired',
          message: `Your reservation for "${res.bookTitle}" has expired as it was not collected within the deadline.`,
          type: 'SYSTEM',
          read: false,
          createdAt: now.toISOString()
        });

        // Check waitlist
        promoteWaitlistIfAvailable(db, res.bookTitleId, res.bookId);
      }
    }
  }

  // 3. Recompute available copy counts on parent books
  for (const book of db.books) {
    const copies = db.book_copies.filter(c => c.bookTitleId === book.id);
    book.totalCopies = copies.length;
    book.availableCopies = copies.filter(c => c.status === 'AVAILABLE').length;
  }
}

// When a book copy becomes available, offer it to next waiting student
export function promoteWaitlistIfAvailable(db: DatabaseSchema, bookTitleId: string, bookId: string): boolean {
  const waitlistQueue = db.waitlist
    .filter(w => w.bookTitleId === bookTitleId && w.status === 'WAITING')
    .sort((a, b) => a.position - b.position);

  if (waitlistQueue.length === 0) return false;

  const nextInLine = waitlistQueue[0];
  const copy = db.book_copies.find(c => c.bookId === bookId);
  if (!copy || copy.status !== 'AVAILABLE') return false;

  // Create temporary reservation for waitlisted student
  const hoursDeadline = db.library_settings.pickupDeadlineHours;
  const deadline = new Date(Date.now() + hoursDeadline * 3600000).toISOString();
  const resId = `res-${Date.now()}`;

  const newReservation: Reservation = {
    id: resId,
    reservationId: `RES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    studentId: nextInLine.studentId,
    studentRollNo: nextInLine.studentRollNo,
    studentName: nextInLine.studentName,
    bookTitleId: nextInLine.bookTitleId,
    bookTitle: nextInLine.bookTitle,
    bookId: copy.bookId,
    reservedAt: new Date().toISOString(),
    pickupDeadline: deadline,
    status: 'READY_FOR_PICKUP',
    notes: 'Auto-promoted from Waitlist Position #1'
  };

  db.reservations.push(newReservation);
  copy.status = 'RESERVED';
  copy.currentReservationId = resId;

  nextInLine.status = 'OFFERED';
  nextInLine.offeredAt = new Date().toISOString();
  nextInLine.pickupDeadline = deadline;
  nextInLine.assignedBookId = copy.bookId;

  // Reposition remaining
  let pos = 1;
  for (const w of db.waitlist.filter(w => w.bookTitleId === bookTitleId && w.status === 'WAITING')) {
    w.position = pos++;
  }

  // Add Notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: nextInLine.studentId,
    title: 'Waitlist Book Available!',
    message: `A physical copy of "${nextInLine.bookTitle}" (Book ID: ${copy.bookId}) is now reserved for you! Please collect before ${new Date(deadline).toLocaleString()}.`,
    type: 'WAITLIST_AVAILABLE',
    read: false,
    createdAt: new Date().toISOString()
  });

  // Log action
  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: 'SYSTEM',
    action: 'WAITLIST_AUTO_PROMOTED',
    details: `Offered available Book ID ${copy.bookId} to waitlisted student ${nextInLine.studentRollNo} (${nextInLine.studentName}).`
  });

  return true;
}

export function computeDashboardStats(db: DatabaseSchema): DashboardStats {
  const totalBooks = db.books.length;
  const totalCopies = db.book_copies.length;
  const availableCopies = db.book_copies.filter(c => c.status === 'AVAILABLE').length;
  const issuedCopies = db.book_copies.filter(c => c.status === 'ISSUED' || c.status === 'DUE_SOON').length;
  const reservedCopies = db.book_copies.filter(c => c.status === 'RESERVED').length;
  const overdueCopies = db.book_copies.filter(c => c.status === 'OVERDUE').length;
  const totalStudents = db.students.length;
  const activeReservations = db.reservations.filter(r => ['PENDING', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status)).length;
  const pendingReturns = db.borrow_transactions.filter(t => t.status !== 'RETURNED').length;
  
  const totalFinesPending = db.fines
    .filter(f => f.status === 'PENDING')
    .reduce((sum, f) => sum + f.totalAmount, 0);

  const totalFinesCollected = db.fines
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + f.totalAmount, 0);

  const activeWaitlistCount = db.waitlist.filter(w => w.status === 'WAITING').length;

  return {
    totalBooks,
    totalCopies,
    availableCopies,
    issuedCopies,
    reservedCopies,
    overdueCopies,
    totalStudents,
    activeReservations,
    pendingReturns,
    totalFinesPending,
    totalFinesCollected,
    activeWaitlistCount
  };
}
