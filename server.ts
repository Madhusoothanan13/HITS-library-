import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import {
  getDb,
  saveDb,
  hashPassword,
  verifyPassword,
  generateRandom8DigitId,
  isValid8DigitId,
  promoteWaitlistIfAvailable,
  computeDashboardStats
} from './server/db.js';
import { BookCopy, BookStatus, BorrowTransaction } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory token session storage
const sessions = new Map<string, { userId: string; role: 'STUDENT' | 'ADMIN'; username: string }>();

function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
  (req as any).user = session;
  next();
}

function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
  next();
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = getDb();
  const cleanUsername = username.trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // If student, check if account is active
  let studentDetails = null;
  if (user.role === 'STUDENT' && user.studentId) {
    const student = db.students.find(s => s.id === user.studentId);
    if (student && student.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your student library account is currently suspended. Please contact the librarian.' });
    }
    studentDetails = student;
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sessions.set(token, { userId: user.id, role: user.role, username: user.username });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      studentId: user.studentId
    },
    student: studentDetails
  });
});

app.post('/api/auth/register-student', (req: Request, res: Response) => {
  const { rollNo, name, email, department, semester, phone, password } = req.body;

  if (!rollNo || !name || !email || !department || !password) {
    return res.status(400).json({ error: 'All mandatory student details and password are required' });
  }

  const db = getDb();
  const cleanRollNo = rollNo.trim().toUpperCase();

  // Check duplicate username / rollNo
  if (db.users.some(u => u.username.toUpperCase() === cleanRollNo)) {
    return res.status(400).json({ error: `Roll No / Student ID ${cleanRollNo} already registered` });
  }

  const studentId = `stu-${Date.now()}`;
  const userId = `usr-${Date.now()}`;
  const creds = hashPassword(password);
  const cardNumber = `LIB-${cleanRollNo}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newStudent = {
    id: studentId,
    rollNo: cleanRollNo,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    department: department.trim(),
    semester: semester || 'Semester 1',
    phone: phone || '',
    status: 'ACTIVE' as const,
    maxBorrowLimit: db.library_settings.maxBorrowLimitPerStudent || 3,
    registeredAt: new Date().toISOString(),
    libraryCardNumber: cardNumber
  };

  const newUser = {
    id: userId,
    username: cleanRollNo,
    role: 'STUDENT' as const,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    studentId: studentId,
    passwordHash: creds.hash,
    salt: creds.salt
  };

  db.students.push(newStudent);
  db.users.push(newUser);

  // Welcome notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: studentId,
    title: 'Welcome to Central Library Online System',
    message: `Your account is active with Library Card #${cardNumber}. You can reserve up to ${newStudent.maxBorrowLimit} books.`,
    type: 'SYSTEM',
    read: false,
    createdAt: new Date().toISOString()
  });

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: cleanRollNo,
    action: 'STUDENT_REGISTERED',
    details: `New student registration for ${name} (${cleanRollNo}), Dept: ${department}.`
  });

  saveDb();

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sessions.set(token, { userId: newUser.id, role: 'STUDENT', username: cleanRollNo });

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
      studentId: newUser.studentId
    },
    student: newStudent
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User record not found' });
  }

  let student = null;
  if (user.role === 'STUDENT' && user.studentId) {
    student = db.students.find(s => s.id === user.studentId);
  }

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      studentId: user.studentId
    },
    student
  });
});

// -------------------------------------------------------------
// 2. BOOKS & COPIES ENDPOINTS
// -------------------------------------------------------------
app.get('/api/books', (req: Request, res: Response) => {
  const { q, category, department, availability } = req.query;
  const db = getDb();
  let books = [...db.books];

  const copies = db.book_copies;

  if (q && typeof q === 'string') {
    const term = q.trim().toLowerCase();

    // Check if query is an exact or partial 8-digit physical book ID search
    const matchingCopies = copies.filter(c => c.bookId.toLowerCase().includes(term));
    const matchingBookTitleIds = new Set(matchingCopies.map(c => c.bookTitleId));

    books = books.filter(b => 
      matchingBookTitleIds.has(b.id) ||
      b.title.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      b.isbn.toLowerCase().includes(term) ||
      b.category.toLowerCase().includes(term) ||
      b.subject.toLowerCase().includes(term) ||
      b.department.toLowerCase().includes(term) ||
      b.shelfNumber.toLowerCase().includes(term)
    );
  }

  if (category && typeof category === 'string' && category !== 'ALL') {
    books = books.filter(b => b.category.toLowerCase() === category.toLowerCase());
  }

  if (department && typeof department === 'string' && department !== 'ALL') {
    books = books.filter(b => b.department.toLowerCase() === department.toLowerCase());
  }

  if (availability && typeof availability === 'string') {
    if (availability === 'AVAILABLE') {
      books = books.filter(b => b.availableCopies > 0);
    } else if (availability === 'UNAVAILABLE') {
      books = books.filter(b => b.availableCopies === 0);
    }
  }

  // Attach physical copies to each book response
  const enrichedBooks = books.map(b => {
    const bookCopies = copies.filter(c => c.bookTitleId === b.id);
    return {
      ...b,
      copies: bookCopies
    };
  });

  res.json({ books: enrichedBooks });
});

// Direct lookup by exact 8-digit physical Book ID
app.get('/api/books/by-copy-id/:bookId', (req: Request, res: Response) => {
  const { bookId } = req.params;
  const db = getDb();

  const copy = db.book_copies.find(c => c.bookId === bookId.trim());
  if (!copy) {
    return res.status(404).json({ error: `Physical book copy with 8-digit ID "${bookId}" not found in library inventory.` });
  }

  const book = db.books.find(b => b.id === copy.bookTitleId);
  if (!book) {
    return res.status(404).json({ error: 'Parent book title not found' });
  }

  // If issued, find expected due date
  let activeLoan = null;
  if (copy.status === 'ISSUED' || copy.status === 'DUE_SOON' || copy.status === 'OVERDUE') {
    activeLoan = db.borrow_transactions.find(t => t.bookId === copy.bookId && t.status !== 'RETURNED');
  }

  res.json({
    copy,
    book,
    expectedReturnDate: activeLoan ? activeLoan.dueDate : null,
    currentBorrower: activeLoan ? activeLoan.studentName : null
  });
});

app.get('/api/books/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const book = db.books.find(b => b.id === id);
  if (!book) {
    return res.status(404).json({ error: 'Book title not found' });
  }

  const copies = db.book_copies.filter(c => c.bookTitleId === book.id);
  
  // Find active loans for unavailable copies to show expected return dates
  const enrichedCopies = copies.map(c => {
    const loan = db.borrow_transactions.find(t => t.bookId === c.bookId && t.status !== 'RETURNED');
    const resv = db.reservations.find(r => r.bookId === c.bookId && ['PENDING', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status));
    return {
      ...c,
      expectedReturnDate: loan ? loan.dueDate : null,
      borrowerName: loan ? loan.studentName : null,
      reservationHolder: resv ? resv.studentName : null,
      pickupDeadline: resv ? resv.pickupDeadline : null
    };
  });

  const waitlistQueue = db.waitlist
    .filter(w => w.bookTitleId === book.id && w.status === 'WAITING')
    .sort((a, b) => a.position - b.position);

  res.json({
    book: {
      ...book,
      copies: enrichedCopies
    },
    waitlistCount: waitlistQueue.length
  });
});

// Admin Add Book
app.post('/api/books', authenticate, requireAdmin, (req: Request, res: Response) => {
  const {
    title,
    author,
    isbn,
    edition,
    publisher,
    category,
    subject,
    department,
    description,
    coverUrl,
    shelfNumber,
    location,
    initialCopiesCount,
    custom8DigitIds
  } = req.body;

  if (!title || !author || !isbn || !category || !shelfNumber) {
    return res.status(400).json({ error: 'Title, author, ISBN, category, and shelf number are required.' });
  }

  const db = getDb();
  const existingIds = new Set(db.book_copies.map(c => c.bookId));

  const bookId = `book-${Date.now()}`;
  const copiesCount = Math.max(1, parseInt(initialCopiesCount || '1', 10));
  const newCopies: BookCopy[] = [];

  // Generate or validate 8-digit IDs
  for (let i = 0; i < copiesCount; i++) {
    let copyBookId = custom8DigitIds && custom8DigitIds[i] ? custom8DigitIds[i].trim() : '';
    if (copyBookId) {
      if (!isValid8DigitId(copyBookId)) {
        return res.status(400).json({ error: `Book ID "${copyBookId}" is invalid. Every physical copy must have exactly 8 numeric digits.` });
      }
      if (existingIds.has(copyBookId)) {
        return res.status(400).json({ error: `Book ID "${copyBookId}" already exists in the library system. Duplicates are strictly prohibited.` });
      }
    } else {
      copyBookId = generateRandom8DigitId(existingIds);
    }
    existingIds.add(copyBookId);

    newCopies.push({
      bookId: copyBookId,
      bookTitleId: bookId,
      copyNumber: i + 1,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      shelfNumber: shelfNumber.trim(),
      location: location || 'Central Library Stacks'
    });
  }

  const newBook = {
    id: bookId,
    title: title.trim(),
    author: author.trim(),
    isbn: isbn.trim(),
    edition: edition ? edition.trim() : '1st Edition',
    publisher: publisher ? publisher.trim() : 'Academic Press',
    category: category.trim(),
    subject: subject ? subject.trim() : category.trim(),
    department: department ? department.trim() : 'General Engineering',
    description: description ? description.trim() : '',
    coverUrl: coverUrl ? coverUrl.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    shelfNumber: shelfNumber.trim(),
    location: location ? location.trim() : 'Floor 1, Stacks',
    totalCopies: newCopies.length,
    availableCopies: newCopies.length,
    tags: [category, subject].filter(Boolean)
  };

  db.books.unshift(newBook);
  db.book_copies.push(...newCopies);

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'BOOK_ADDED',
    details: `Added "${newBook.title}" with ${newCopies.length} physical copies (IDs: ${newCopies.map(c => c.bookId).join(', ')}) at shelf ${newBook.shelfNumber}.`
  });

  saveDb();
  res.status(201).json({ book: newBook, copies: newCopies });
});

// Admin Add Physical Copy to existing book
app.post('/api/books/:id/copies', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookId: customBookId, condition, shelfNumber, location } = req.body;
  const db = getDb();

  const book = db.books.find(b => b.id === id);
  if (!book) {
    return res.status(404).json({ error: 'Book title not found' });
  }

  const existingIds = new Set(db.book_copies.map(c => c.bookId));
  let finalBookId = customBookId ? customBookId.trim() : '';

  if (finalBookId) {
    if (!isValid8DigitId(finalBookId)) {
      return res.status(400).json({ error: 'Book ID must be exactly 8 numeric digits (e.g. 58274103)' });
    }
    if (existingIds.has(finalBookId)) {
      return res.status(400).json({ error: `Book ID "${finalBookId}" already exists. Duplicate IDs are not permitted.` });
    }
  } else {
    finalBookId = generateRandom8DigitId(existingIds);
  }

  const currentCopies = db.book_copies.filter(c => c.bookTitleId === book.id);
  const newCopy: BookCopy = {
    bookId: finalBookId,
    bookTitleId: book.id,
    copyNumber: currentCopies.length + 1,
    status: 'AVAILABLE',
    condition: condition || 'EXCELLENT',
    shelfNumber: shelfNumber || book.shelfNumber,
    location: location || book.location
  };

  db.book_copies.push(newCopy);
  book.totalCopies = currentCopies.length + 1;
  book.availableCopies += 1;

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'BOOK_COPY_ADDED',
    details: `Added new physical copy [Book ID: ${finalBookId}] for "${book.title}".`
  });

  // Check waitlist
  promoteWaitlistIfAvailable(db, book.id, newCopy.bookId);

  saveDb();
  res.status(201).json({ copy: newCopy });
});

// Admin update copy status (e.g. mark MAINTENANCE, AVAILABLE)
app.patch('/api/books/copies/:bookId', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { bookId } = req.params;
  const { status, condition, notes, shelfNumber } = req.body;
  const db = getDb();

  const copy = db.book_copies.find(c => c.bookId === bookId.trim());
  if (!copy) {
    return res.status(404).json({ error: 'Physical copy not found' });
  }

  if (copy.status === 'ISSUED' && status === 'MAINTENANCE') {
    return res.status(400).json({ error: 'Cannot mark an issued copy as maintenance. Please return the book first.' });
  }

  const prevStatus = copy.status;
  if (status) copy.status = status as BookStatus;
  if (condition) copy.condition = condition;
  if (notes !== undefined) copy.notes = notes;
  if (shelfNumber) copy.shelfNumber = shelfNumber;

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'COPY_STATUS_UPDATED',
    details: `Updated copy ${bookId} status from ${prevStatus} to ${copy.status}.`
  });

  // If became available, check waitlist
  if (prevStatus !== 'AVAILABLE' && copy.status === 'AVAILABLE') {
    promoteWaitlistIfAvailable(db, copy.bookTitleId, copy.bookId);
  }

  saveDb();
  res.json({ copy });
});

// Admin edit book title metadata
app.put('/api/books/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();

  const bookIndex = db.books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book title not found' });
  }

  const {
    title,
    author,
    isbn,
    edition,
    publisher,
    category,
    subject,
    department,
    description,
    coverUrl,
    shelfNumber,
    location
  } = req.body;

  db.books[bookIndex] = {
    ...db.books[bookIndex],
    title: title?.trim() || db.books[bookIndex].title,
    author: author?.trim() || db.books[bookIndex].author,
    isbn: isbn?.trim() || db.books[bookIndex].isbn,
    edition: edition?.trim() || db.books[bookIndex].edition,
    publisher: publisher?.trim() || db.books[bookIndex].publisher,
    category: category?.trim() || db.books[bookIndex].category,
    subject: subject?.trim() || db.books[bookIndex].subject,
    department: department?.trim() || db.books[bookIndex].department,
    description: description !== undefined ? description.trim() : db.books[bookIndex].description,
    coverUrl: coverUrl?.trim() || db.books[bookIndex].coverUrl,
    shelfNumber: shelfNumber?.trim() || db.books[bookIndex].shelfNumber,
    location: location?.trim() || db.books[bookIndex].location
  };

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'BOOK_UPDATED',
    details: `Updated metadata for "${db.books[bookIndex].title}".`
  });

  saveDb();
  res.json({ book: db.books[bookIndex] });
});

// -------------------------------------------------------------
// 3. BOOK RESERVATION ENDPOINTS
// -------------------------------------------------------------
app.post('/api/reservations', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const { bookTitleId, bookId: requestedBookId, studentId: overrideStudentId } = req.body;
  const db = getDb();

  // Determine student
  const studentId = session.role === 'ADMIN' && overrideStudentId ? overrideStudentId : session.userId;
  const student = db.students.find(s => s.id === (session.role === 'STUDENT' ? (db.users.find(u => u.id === session.userId)?.studentId || studentId) : studentId));

  if (!student) {
    return res.status(404).json({ error: 'Student record not found' });
  }

  // 1. Verify student account is active
  if (student.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Your student account is not active. Reservations cannot be created.' });
  }

  // 2. Verify student has not exceeded borrowing/reservation limit
  const activeLoansCount = db.borrow_transactions.filter(t => t.studentId === student.id && t.status !== 'RETURNED').length;
  const activeReservationsCount = db.reservations.filter(r => r.studentId === student.id && ['PENDING', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status)).length;
  const totalCommitted = activeLoansCount + activeReservationsCount;

  if (totalCommitted >= student.maxBorrowLimit) {
    return res.status(400).json({
      error: `Borrowing limit exceeded. You currently have ${activeLoansCount} borrowed book(s) and ${activeReservationsCount} active reservation(s). Maximum allowed is ${student.maxBorrowLimit}.`
    });
  }

  // 3. Verify student does not already have an active reservation for this book title
  const hasReservation = db.reservations.some(r => 
    r.studentId === student.id &&
    r.bookTitleId === bookTitleId &&
    ['PENDING', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status)
  );
  if (hasReservation) {
    return res.status(400).json({ error: 'You already have an active reservation for this book title.' });
  }

  // 4. Verify student does not already have the same book currently borrowed
  const hasLoan = db.borrow_transactions.some(t =>
    t.studentId === student.id &&
    t.bookTitleId === bookTitleId &&
    t.status !== 'RETURNED'
  );
  if (hasLoan) {
    return res.status(400).json({ error: 'You already have a physical copy of this book currently issued to you.' });
  }

  // 5. Find available copy
  const book = db.books.find(b => b.id === bookTitleId);
  if (!book) {
    return res.status(404).json({ error: 'Book title not found' });
  }

  let copy = null;
  if (requestedBookId) {
    copy = db.book_copies.find(c => c.bookId === requestedBookId && c.bookTitleId === bookTitleId && c.status === 'AVAILABLE');
  } else {
    copy = db.book_copies.find(c => c.bookTitleId === bookTitleId && c.status === 'AVAILABLE');
  }

  if (!copy) {
    return res.status(400).json({
      error: 'No physical copy is currently available for reservation. You may join the waitlist instead.'
    });
  }

  // Create reservation
  const pickupHours = db.library_settings.pickupDeadlineHours || 48;
  const pickupDeadline = new Date(Date.now() + pickupHours * 3600000).toISOString();
  const resId = `res-${Date.now()}`;
  const readableResId = `RES-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const reservation = {
    id: resId,
    reservationId: readableResId,
    studentId: student.id,
    studentRollNo: student.rollNo,
    studentName: student.name,
    bookTitleId: book.id,
    bookTitle: book.title,
    bookId: copy.bookId,
    reservedAt: new Date().toISOString(),
    pickupDeadline: pickupDeadline,
    status: 'READY_FOR_PICKUP' as const,
    notes: 'Online reservation confirmed'
  };

  db.reservations.push(reservation);
  copy.status = 'RESERVED';
  copy.currentReservationId = resId;

  // Notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: student.id,
    title: 'Reservation Confirmed',
    message: `Book "${book.title}" [Book ID: ${copy.bookId}] is reserved for you. Please pickup by ${new Date(pickupDeadline).toLocaleString()}.`,
    type: 'RESERVATION_SUCCESS',
    read: false,
    createdAt: new Date().toISOString()
  });

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: student.rollNo,
    action: 'RESERVATION_CREATED',
    details: `Reservation ${readableResId} created for student ${student.name} (${student.rollNo}) on physical Book ID ${copy.bookId}.`
  });

  saveDb();
  res.status(201).json({ reservation, copy });
});

app.get('/api/reservations', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();

  let reservations = [...db.reservations];

  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    const studentId = user?.studentId;
    reservations = reservations.filter(r => r.studentId === studentId);
  }

  // Sort latest first
  reservations.sort((a, b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime());

  res.json({ reservations });
});

app.post('/api/reservations/:id/cancel', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const session = (req as any).user;
  const db = getDb();

  const resIndex = db.reservations.findIndex(r => r.id === id);
  if (resIndex === -1) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const reservation = db.reservations[resIndex];

  // Authorization check
  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    if (reservation.studentId !== user?.studentId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this reservation' });
    }
  }

  reservation.status = 'CANCELLED';

  // Free copy
  const copy = db.book_copies.find(c => c.bookId === reservation.bookId);
  if (copy && copy.status === 'RESERVED') {
    copy.status = 'AVAILABLE';
    copy.currentReservationId = undefined;
    // Check waitlist
    promoteWaitlistIfAvailable(db, reservation.bookTitleId, copy.bookId);
  }

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: session.username,
    action: 'RESERVATION_CANCELLED',
    details: `Cancelled reservation ${reservation.reservationId} for Book ID ${reservation.bookId}.`
  });

  saveDb();
  res.json({ message: 'Reservation cancelled successfully', reservation });
});

// -------------------------------------------------------------
// 4. LIMITED-TIME BORROWING & ISSUES
// -------------------------------------------------------------
app.post('/api/transactions/issue', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { studentRollNo, bookId } = req.body;

  if (!studentRollNo || !bookId) {
    return res.status(400).json({ error: 'Student Roll No and 8-digit Book ID are required.' });
  }

  if (!isValid8DigitId(bookId)) {
    return res.status(400).json({ error: 'Book ID must contain exactly 8 numeric digits.' });
  }

  const db = getDb();
  const cleanRoll = studentRollNo.trim().toUpperCase();
  const cleanBookId = bookId.trim();

  // Find student
  const student = db.students.find(s => s.rollNo.toUpperCase() === cleanRoll);
  if (!student) {
    return res.status(404).json({ error: `Student with Roll No "${studentRollNo}" was not found.` });
  }

  if (student.status !== 'ACTIVE') {
    return res.status(403).json({ error: `Student account is ${student.status}. Cannot issue books.` });
  }

  // Check active borrow count
  const activeLoans = db.borrow_transactions.filter(t => t.studentId === student.id && t.status !== 'RETURNED');
  if (activeLoans.length >= student.maxBorrowLimit) {
    return res.status(400).json({
      error: `Student has reached the maximum borrowing limit of ${student.maxBorrowLimit} books.`
    });
  }

  // Find physical copy
  const copy = db.book_copies.find(c => c.bookId === cleanBookId);
  if (!copy) {
    return res.status(404).json({ error: `No physical book copy with 8-digit ID "${cleanBookId}" exists in the catalog.` });
  }

  if (copy.status === 'MAINTENANCE') {
    return res.status(400).json({ error: `Physical book ${cleanBookId} is marked under MAINTENANCE and cannot be issued.` });
  }

  if (copy.status === 'ISSUED' || copy.status === 'OVERDUE' || copy.status === 'DUE_SOON') {
    return res.status(400).json({ error: `Physical book ${cleanBookId} is currently issued to another student.` });
  }

  // If reserved, must be reserved by this student or expired
  if (copy.status === 'RESERVED') {
    const reservation = db.reservations.find(r => r.bookId === cleanBookId && ['READY_FOR_PICKUP', 'PENDING', 'APPROVED'].includes(r.status));
    if (reservation && reservation.studentId !== student.id) {
      return res.status(400).json({
        error: `Physical book ${cleanBookId} is currently held under reservation for another student (${reservation.studentRollNo}).`
      });
    }
  }

  const parentBook = db.books.find(b => b.id === copy.bookTitleId);
  if (!parentBook) {
    return res.status(404).json({ error: 'Book title record missing.' });
  }

  // Calculate limited-time borrowing dates
  const borrowDays = db.library_settings.standardBorrowPeriodDays || 14;
  const now = new Date();
  const issueDate = now.toISOString();
  const dueDate = new Date(now.getTime() + borrowDays * 86400000).toISOString();

  const txnId = `txn-${Date.now()}`;
  const readableTxnId = `TXN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newTransaction: BorrowTransaction = {
    id: txnId,
    transactionId: readableTxnId,
    studentId: student.id,
    studentRollNo: student.rollNo,
    studentName: student.name,
    bookTitleId: parentBook.id,
    bookTitle: parentBook.title,
    bookId: copy.bookId,
    issueDate: issueDate,
    dueDate: dueDate,
    status: 'ACTIVE',
    overdueDays: 0,
    fineAmount: 0,
    finePaid: true,
    issuedBy: (req as any).user.username
  };

  db.borrow_transactions.unshift(newTransaction);
  copy.status = 'ISSUED';
  copy.currentBorrowerStudentId = student.id;

  // Fulfill reservation if exists
  const activeRes = db.reservations.find(r => r.bookId === copy.bookId && r.studentId === student.id && ['READY_FOR_PICKUP', 'APPROVED', 'PENDING'].includes(r.status));
  if (activeRes) {
    activeRes.status = 'FULFILLED';
    copy.currentReservationId = undefined;
  }

  // Student notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: student.id,
    title: 'Book Issued Successfully',
    message: `"${parentBook.title}" [Book ID: ${copy.bookId}] has been issued. Due date: ${new Date(dueDate).toLocaleDateString()} (${borrowDays} days period).`,
    type: 'SYSTEM',
    read: false,
    createdAt: new Date().toISOString()
  });

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'BOOK_ISSUED',
    details: `Issued Book ID ${copy.bookId} ("${parentBook.title}") to ${student.name} (${student.rollNo}). Due date: ${new Date(dueDate).toLocaleDateString()}.`
  });

  saveDb();
  res.status(201).json({ transaction: newTransaction, copy });
});

app.get('/api/transactions', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const { studentId, status } = req.query;
  const db = getDb();

  let transactions = [...db.borrow_transactions];

  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    transactions = transactions.filter(t => t.studentId === user?.studentId);
  } else if (studentId && typeof studentId === 'string') {
    transactions = transactions.filter(t => t.studentId === studentId);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    transactions = transactions.filter(t => t.status === status);
  }

  res.json({ transactions });
});

// -------------------------------------------------------------
// 5. RETURN SYSTEM & BACKEND FINE CALCULATION
// -------------------------------------------------------------
app.post('/api/transactions/return', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { bookId, conditionNotes, markMaintenance } = req.body;

  if (!bookId) {
    return res.status(400).json({ error: '8-digit Book ID is required to process return.' });
  }

  const db = getDb();
  const cleanBookId = bookId.trim();

  // Find active transaction for this book copy
  const transaction = db.borrow_transactions.find(t => t.bookId === cleanBookId && t.status !== 'RETURNED');
  if (!transaction) {
    return res.status(404).json({ error: `No active issue record found for physical Book ID ${cleanBookId}.` });
  }

  const copy = db.book_copies.find(c => c.bookId === cleanBookId);
  if (!copy) {
    return res.status(404).json({ error: 'Physical book copy record missing.' });
  }

  const now = new Date();
  const dueDate = new Date(transaction.dueDate);
  const diffMs = now.getTime() - dueDate.getTime();
  const overdueDays = Math.max(0, Math.floor(diffMs / 86400000));
  const finePerDay = db.library_settings.finePerDayRupees;
  const calculatedFine = overdueDays * finePerDay;

  transaction.returnDate = now.toISOString();
  transaction.status = 'RETURNED';
  transaction.overdueDays = overdueDays;
  transaction.fineAmount = calculatedFine;
  transaction.returnedTo = (req as any).user.username;

  // Handle fine record
  if (calculatedFine > 0) {
    transaction.finePaid = false;
    let fineRecord = db.fines.find(f => f.transactionId === transaction.id);
    if (!fineRecord) {
      fineRecord = {
        id: `fn-${Date.now()}`,
        transactionId: transaction.id,
        studentId: transaction.studentId,
        studentRollNo: transaction.studentRollNo,
        studentName: transaction.studentName,
        bookTitle: transaction.bookTitle,
        bookId: transaction.bookId,
        overdueDays: overdueDays,
        finePerDay: finePerDay,
        totalAmount: calculatedFine,
        status: 'PENDING',
        createdAt: now.toISOString()
      };
      db.fines.push(fineRecord);
    } else {
      fineRecord.overdueDays = overdueDays;
      fineRecord.totalAmount = calculatedFine;
      fineRecord.finePerDay = finePerDay;
    }

    // Student notification about fine
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: transaction.studentId,
      title: 'Book Returned with Overdue Fine',
      message: `"${transaction.bookTitle}" [Book ID: ${cleanBookId}] returned ${overdueDays} days late. Accrued fine: ₹${calculatedFine} (${overdueDays} days × ₹${finePerDay}).`,
      type: 'FINE_GENERATED',
      read: false,
      createdAt: now.toISOString()
    });
  } else {
    transaction.finePaid = true;
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: transaction.studentId,
      title: 'Book Returned Successfully',
      message: `"${transaction.bookTitle}" [Book ID: ${cleanBookId}] has been checked in on time. Thank you!`,
      type: 'SYSTEM',
      read: false,
      createdAt: now.toISOString()
    });
  }

  // Update physical copy status
  copy.currentBorrowerStudentId = undefined;
  if (markMaintenance) {
    copy.status = 'MAINTENANCE';
    copy.notes = conditionNotes || 'Marked for maintenance upon return';
  } else {
    copy.status = 'AVAILABLE';
    if (conditionNotes) copy.notes = conditionNotes;
    // Auto-promote waitlist!
    promoteWaitlistIfAvailable(db, copy.bookTitleId, copy.bookId);
  }

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: now.toISOString(),
    adminUsername: (req as any).user.username,
    action: 'BOOK_RETURNED',
    details: `Returned Book ID ${cleanBookId} by ${transaction.studentRollNo}. Overdue: ${overdueDays} days, Fine: ₹${calculatedFine}. Next status: ${copy.status}.`
  });

  saveDb();
  res.json({
    message: 'Book returned successfully',
    transaction,
    copy,
    overdueDays,
    fineAmount: calculatedFine
  });
});

// -------------------------------------------------------------
// 6. WAITLIST SYSTEM
// -------------------------------------------------------------
app.post('/api/waitlist/join', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const { bookTitleId } = req.body;
  const db = getDb();

  const user = db.users.find(u => u.id === session.userId);
  if (!user || user.role !== 'STUDENT' || !user.studentId) {
    return res.status(403).json({ error: 'Only registered students can join the waitlist.' });
  }

  const student = db.students.find(s => s.id === user.studentId);
  if (!student || student.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Student account is not active.' });
  }

  const book = db.books.find(b => b.id === bookTitleId);
  if (!book) {
    return res.status(404).json({ error: 'Book title not found' });
  }

  // If book has available copies, reservation should be used instead
  if (book.availableCopies > 0) {
    return res.status(400).json({ error: 'This book currently has physical copies available! You can reserve it directly instead of waitlisting.' });
  }

  // Check if student is already on waitlist
  const existingWaitlist = db.waitlist.find(w => w.bookTitleId === book.id && w.studentId === student.id && w.status === 'WAITING');
  if (existingWaitlist) {
    return res.status(400).json({ error: `You are already on the waitlist for this title at position #${existingWaitlist.position}.` });
  }

  // Check current queue length
  const currentQueue = db.waitlist.filter(w => w.bookTitleId === book.id && w.status === 'WAITING');
  const position = currentQueue.length + 1;

  const entry: any = {
    id: `wt-${Date.now()}`,
    bookTitleId: book.id,
    bookTitle: book.title,
    studentId: student.id,
    studentRollNo: student.rollNo,
    studentName: student.name,
    joinedAt: new Date().toISOString(),
    position: position,
    status: 'WAITING'
  };

  db.waitlist.push(entry);

  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: student.id,
    title: 'Joined Book Waitlist',
    message: `You joined the waitlist for "${book.title}" at Position #${position}. You will be notified as soon as a copy is returned.`,
    type: 'SYSTEM',
    read: false,
    createdAt: new Date().toISOString()
  });

  saveDb();
  res.status(201).json({ waitlistEntry: entry });
});

app.get('/api/waitlist', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();
  let entries = [...db.waitlist];

  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    entries = entries.filter(w => w.studentId === user?.studentId);
  }

  res.json({ waitlist: entries });
});

// -------------------------------------------------------------
// 7. FINES & WAIVER SYSTEM
// -------------------------------------------------------------
app.get('/api/fines', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();
  let fines = [...db.fines];

  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    fines = fines.filter(f => f.studentId === user?.studentId);
  }

  fines.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ fines });
});

app.post('/api/fines/:id/pay', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;
  const db = getDb();

  const fine = db.fines.find(f => f.id === id);
  if (!fine) {
    return res.status(404).json({ error: 'Fine record not found' });
  }

  fine.status = 'PAID';
  fine.paidAt = new Date().toISOString();
  fine.paymentMethod = paymentMethod || 'Cash at Counter';
  fine.receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  // Also mark transaction finePaid
  const txn = db.borrow_transactions.find(t => t.id === fine.transactionId);
  if (txn) txn.finePaid = true;

  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: fine.studentId,
    title: 'Fine Payment Received',
    message: `Payment of ₹${fine.totalAmount} received for overdue fine on Book ID ${fine.bookId}. Receipt: ${fine.receiptNumber}.`,
    type: 'SYSTEM',
    read: false,
    createdAt: new Date().toISOString()
  });

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'FINE_COLLECTED',
    details: `Collected fine of ₹${fine.totalAmount} from student ${fine.studentRollNo} (Receipt ${fine.receiptNumber}).`
  });

  saveDb();
  res.json({ fine });
});

app.post('/api/fines/:id/waive', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = getDb();

  const fine = db.fines.find(f => f.id === id);
  if (!fine) {
    return res.status(404).json({ error: 'Fine record not found' });
  }

  fine.status = 'WAIVED';
  fine.paidAt = new Date().toISOString();
  fine.paymentMethod = `Waived: ${reason || 'Admin Discretion'}`;

  const txn = db.borrow_transactions.find(t => t.id === fine.transactionId);
  if (txn) txn.finePaid = true;

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'FINE_WAIVED',
    details: `Waived fine of ₹${fine.totalAmount} for ${fine.studentRollNo}. Reason: ${reason || 'Admin discretion'}.`
  });

  saveDb();
  res.json({ fine });
});

// -------------------------------------------------------------
// 8. QR CODE GENERATION
// -------------------------------------------------------------
app.get('/api/qr/book/:bookId', async (req: Request, res: Response) => {
  const { bookId } = req.params;
  const db = getDb();

  const copy = db.book_copies.find(c => c.bookId === bookId.trim());
  if (!copy) {
    return res.status(404).json({ error: 'Book copy not found' });
  }

  const book = db.books.find(b => b.id === copy.bookTitleId);

  // Safe book identifier payload (no private student info)
  const qrPayload = JSON.stringify({
    system: 'Smart College Library System',
    type: 'BOOK_PHYSICAL_COPY',
    bookId: copy.bookId,
    title: book?.title || 'Unknown Title',
    isbn: book?.isbn || '',
    shelfNumber: copy.shelfNumber,
    location: copy.location,
    status: copy.status,
    verificationCode: `VERIF-${copy.bookId}-${copy.copyNumber}`
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    res.json({ qrDataUrl, payload: JSON.parse(qrPayload) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// -------------------------------------------------------------
// 9. SMART BOOK RECOMMENDATION (LIBRARY DATA HEURISTIC)
// -------------------------------------------------------------
app.get('/api/recommendations', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();

  const user = db.users.find(u => u.id === session.userId);
  const student = user?.studentId ? db.students.find(s => s.id === user.studentId) : null;

  // Gather past borrowed categories for this student
  let pastCategories = new Set<string>();
  if (student) {
    const studentHistory = db.borrow_transactions.filter(t => t.studentId === student.id);
    for (const t of studentHistory) {
      const b = db.books.find(book => book.id === t.bookTitleId);
      if (b) pastCategories.add(b.category);
    }
  }

  // Count borrowing frequency across library for popular books
  const borrowCounts = new Map<string, number>();
  for (const t of db.borrow_transactions) {
    borrowCounts.set(t.bookTitleId, (borrowCounts.get(t.bookTitleId) || 0) + 1);
  }

  const recommendations = db.books.map(b => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Department match
    if (student && b.department.toLowerCase().includes(student.department.toLowerCase()) || 
        (student && student.department.includes('MCA') && b.category === 'Computer Science')) {
      score += 40;
      reasons.push(`Core curriculum for ${student.department}`);
    }

    // 2. Previously borrowed categories
    if (pastCategories.has(b.category)) {
      score += 30;
      reasons.push(`Based on your reading in ${b.category}`);
    }

    // 3. Library popularity
    const popularity = borrowCounts.get(b.id) || 0;
    if (popularity > 1) {
      score += 20;
      reasons.push(`Popular in college (${popularity} issues)`);
    }

    // 4. Availability bonus
    if (b.availableCopies > 0) {
      score += 10;
    }

    return {
      book: b,
      score,
      reason: reasons[0] || 'Recommended Academic Reference',
      secondaryReason: reasons[1] || null
    };
  });

  recommendations.sort((a, b) => b.score - a.score);

  res.json({
    recommendations: recommendations.slice(0, 4)
  });
});

// -------------------------------------------------------------
// 10. NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/notifications', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();

  let notifs = [...db.notifications];

  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    notifs = notifs.filter(n => n.userId === user?.studentId || n.userId === 'ALL');
  }

  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ notifications: notifs });
});

app.patch('/api/notifications/:id/read', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDb();
  }
  res.json({ success: true });
});

app.patch('/api/notifications/read-all', authenticate, (req: Request, res: Response) => {
  const session = (req as any).user;
  const db = getDb();

  if (session.role === 'STUDENT') {
    const user = db.users.find(u => u.id === session.userId);
    db.notifications.forEach(n => {
      if (n.userId === user?.studentId || n.userId === 'ALL') n.read = true;
    });
  } else {
    db.notifications.forEach(n => { n.read = true; });
  }

  saveDb();
  res.json({ success: true });
});

// -------------------------------------------------------------
// 11. STUDENTS MANAGEMENT (ADMIN)
// -------------------------------------------------------------
app.get('/api/students', authenticate, requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const enriched = db.students.map(s => {
    const activeLoans = db.borrow_transactions.filter(t => t.studentId === s.id && t.status !== 'RETURNED');
    const activeReservations = db.reservations.filter(r => r.studentId === s.id && ['PENDING', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status));
    const pendingFines = db.fines
      .filter(f => f.studentId === s.id && f.status === 'PENDING')
      .reduce((sum, f) => sum + f.totalAmount, 0);

    return {
      ...s,
      activeLoansCount: activeLoans.length,
      activeReservationsCount: activeReservations.length,
      pendingFinesTotal: pendingFines
    };
  });

  res.json({ students: enriched });
});

app.patch('/api/students/:id/status', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDb();

  const student = db.students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.status = status;
  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'STUDENT_STATUS_CHANGED',
    details: `Updated student ${student.rollNo} status to ${status}.`
  });

  saveDb();
  res.json({ student });
});

// -------------------------------------------------------------
// 12. REPORTS & EXPORT
// -------------------------------------------------------------
app.get('/api/reports', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const db = getDb();

  let transactions = [...db.borrow_transactions];
  if (startDate && typeof startDate === 'string') {
    transactions = transactions.filter(t => new Date(t.issueDate) >= new Date(startDate));
  }
  if (endDate && typeof endDate === 'string') {
    transactions = transactions.filter(t => new Date(t.issueDate) <= new Date(endDate));
  }

  // 1. Most borrowed books
  const bookBorrowMap = new Map<string, { title: string; count: number }>();
  for (const t of transactions) {
    const current = bookBorrowMap.get(t.bookTitleId) || { title: t.bookTitle, count: 0 };
    current.count++;
    bookBorrowMap.set(t.bookTitleId, current);
  }
  const mostBorrowedBooks = Array.from(bookBorrowMap.entries())
    .map(([id, val]) => ({ bookId: id, title: val.title, borrowCount: val.count }))
    .sort((a, b) => b.borrowCount - a.borrowCount);

  // 2. Department-wise breakdown
  const deptMap = new Map<string, number>();
  for (const t of transactions) {
    const student = db.students.find(s => s.id === t.studentId);
    const dept = student ? student.department : 'Other';
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  }
  const departmentStats = Array.from(deptMap.entries()).map(([dept, count]) => ({ department: dept, count }));

  // 3. Category-wise breakdown
  const categoryMap = new Map<string, number>();
  for (const t of transactions) {
    const book = db.books.find(b => b.id === t.bookTitleId);
    const cat = book ? book.category : 'General';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  }
  const categoryStats = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));

  // 4. Overdue and returned summaries
  const overdueTransactions = transactions.filter(t => t.status === 'OVERDUE');
  const returnedTransactions = transactions.filter(t => t.status === 'RETURNED');
  const activeTransactions = transactions.filter(t => t.status === 'ACTIVE');

  // 5. Fine collections
  const totalFineCollected = db.fines
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + f.totalAmount, 0);

  const totalFinePending = db.fines
    .filter(f => f.status === 'PENDING')
    .reduce((sum, f) => sum + f.totalAmount, 0);

  res.json({
    summary: {
      totalTransactions: transactions.length,
      activeIssues: activeTransactions.length,
      overdueIssues: overdueTransactions.length,
      returnedCount: returnedTransactions.length,
      totalFineCollected,
      totalFinePending
    },
    mostBorrowedBooks: mostBorrowedBooks.slice(0, 10),
    departmentStats,
    categoryStats,
    overdueTransactions,
    recentReturns: returnedTransactions.slice(0, 10)
  });
});

app.get('/api/reports/export-csv', authenticate, requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const txns = db.borrow_transactions;

  let csv = 'Transaction ID,Student Roll No,Student Name,Book Title,8-Digit Book ID,Issue Date,Due Date,Return Date,Status,Overdue Days,Fine Amount\n';
  for (const t of txns) {
    csv += `"${t.transactionId}","${t.studentRollNo}","${t.studentName}","${t.bookTitle.replace(/"/g, '""')}","${t.bookId}","${t.issueDate.split('T')[0]}","${t.dueDate.split('T')[0]}","${t.returnDate ? t.returnDate.split('T')[0] : 'N/A'}","${t.status}","${t.overdueDays}","₹${t.fineAmount}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="library-transactions-report.csv"');
  res.send(csv);
});

// -------------------------------------------------------------
// 13. SETTINGS, STATS & AUDIT LOGS
// -------------------------------------------------------------
app.get('/api/dashboard/stats', authenticate, requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const stats = computeDashboardStats(db);
  res.json({ stats });
});

app.get('/api/settings', (req: Request, res: Response) => {
  const db = getDb();
  res.json({ settings: db.library_settings });
});

app.put('/api/settings', authenticate, requireAdmin, (req: Request, res: Response) => {
  const {
    standardBorrowPeriodDays,
    finePerDayRupees,
    pickupDeadlineHours,
    maxBorrowLimitPerStudent,
    allowWaitlist,
    institutionName,
    libraryCode,
    contactEmail
  } = req.body;

  const db = getDb();
  db.library_settings = {
    standardBorrowPeriodDays: Number(standardBorrowPeriodDays) || 14,
    finePerDayRupees: Number(finePerDayRupees) || 5,
    pickupDeadlineHours: Number(pickupDeadlineHours) || 48,
    maxBorrowLimitPerStudent: Number(maxBorrowLimitPerStudent) || 3,
    allowWaitlist: allowWaitlist !== undefined ? Boolean(allowWaitlist) : true,
    institutionName: institutionName?.trim() || db.library_settings.institutionName,
    libraryCode: libraryCode?.trim() || db.library_settings.libraryCode,
    contactEmail: contactEmail?.trim() || db.library_settings.contactEmail
  };

  db.audit_logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUsername: (req as any).user.username,
    action: 'SETTINGS_UPDATED',
    details: `Updated borrowing policy: Period=${db.library_settings.standardBorrowPeriodDays}d, Fine=₹${db.library_settings.finePerDayRupees}/d, Deadline=${db.library_settings.pickupDeadlineHours}h, Limit=${db.library_settings.maxBorrowLimitPerStudent}.`
  });

  saveDb();
  res.json({ settings: db.library_settings });
});

app.get('/api/audit-logs', authenticate, requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  res.json({ auditLogs: db.audit_logs });
});

app.get('/api/categories-departments', (req: Request, res: Response) => {
  const db = getDb();
  res.json({
    categories: db.categories,
    departments: db.departments
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / SPA FALLBACK
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart College Library Server running on port ${PORT}`);
  });
}

startServer();
