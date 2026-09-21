import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  Bell, 
  QrCode, 
  ArrowRight, 
  FileText,
  BookmarkCheck,
  XCircle
} from 'lucide-react';
import { Student, BorrowTransaction, Reservation, FineRecord, LibraryNotification, Book, BookCopy } from '../types.js';
import { cancelReservationApi, getRecommendationsApi } from '../services/api.js';

interface StudentDashboardProps {
  student: Student;
  transactions: BorrowTransaction[];
  reservations: Reservation[];
  fines: FineRecord[];
  notifications: LibraryNotification[];
  onSelectBookByTitleId: (titleId: string) => void;
  onOpenLibraryCard: () => void;
  onActionSuccess: (msg: string) => void;
  onOpenQR: (copy: BookCopy, bookTitle: string, author: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  transactions,
  reservations,
  fines,
  notifications,
  onSelectBookByTitleId,
  onOpenLibraryCard,
  onActionSuccess,
  onOpenQR
}) => {
  const [recommendations, setRecommendations] = useState<{ book: Book; score: number; reason: string; secondaryReason: string | null }[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    getRecommendationsApi()
      .then(res => setRecommendations(res.recommendations || []))
      .catch(err => console.error('Failed to load recommendations', err));
  }, []);

  const activeLoans = transactions.filter(t => t.status !== 'RETURNED');
  const overdueLoans = transactions.filter(t => t.status === 'OVERDUE');
  const pastHistory = transactions.filter(t => t.status === 'RETURNED');
  const pendingReservations = reservations.filter(r => ['READY_FOR_PICKUP', 'PENDING', 'APPROVED'].includes(r.status));
  
  const pendingFineTotal = fines
    .filter(f => f.status === 'PENDING')
    .reduce((sum, f) => sum + f.totalAmount, 0);

  const calculateRemainingCountdown = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`, isOverdue: true, days: diffDays };
    } else if (diffDays === 0) {
      return { text: 'Due Today (before 5:00 PM)', isOverdue: false, isUrgent: true, days: 0 };
    } else if (diffDays === 1) {
      return { text: '1 day remaining (Due Tomorrow)', isOverdue: false, isUrgent: true, days: 1 };
    } else {
      return { text: `${diffDays} days remaining`, isOverdue: false, isUrgent: diffDays <= 3, days: diffDays };
    }
  };

  const calculatePickupRemaining = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.max(0, Math.round(diffMs / 3600000));
    return `${diffHours} hours remaining for pickup`;
  };

  const handleCancelReservation = async (resId: string) => {
    if (!confirm('Are you sure you want to cancel this book reservation?')) return;
    setCancellingId(resId);
    try {
      await cancelReservationApi(resId);
      onActionSuccess('Reservation cancelled successfully. The physical copy has been returned to circulation.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Student Welcome Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0c1829] via-[#621708]/35 to-[#0b2419] border border-amber-500/30 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#621708] to-[#991b1b] border border-amber-400/40 flex items-center justify-center text-amber-200 text-2xl font-bold shadow-lg shadow-red-950/50">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{student.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#009D4E]/30 text-emerald-300 border border-[#009D4E] font-semibold uppercase">
                {student.status}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                HITS Student
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Roll No: <strong className="text-amber-300">{student.rollNo}</strong> &bull; {student.semester}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{student.department} &bull; Dr. K.C.G. Verghese Central Library</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLibraryCard}
            className="px-4 py-2.5 bg-[#621708] hover:bg-[#7a1c0d] text-amber-100 border border-amber-500/40 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            View HITS Library Card
          </button>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Currently Borrowed</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{activeLoans.length}</span>
            <span className="text-xs text-slate-400">/ {student.maxBorrowLimit} limit</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active time-limited loans</p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Reservations</span>
            <BookmarkCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{pendingReservations.length}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Held at circulation counter</p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overdue Books</span>
            <AlertCircle className={`w-4 h-4 ${overdueLoans.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${overdueLoans.length > 0 ? 'text-rose-400' : 'text-white'}`}>
              {overdueLoans.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Need immediate return</p>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Fines</span>
            <CreditCard className={`w-4 h-4 ${pendingFineTotal > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className={`text-3xl font-extrabold ${pendingFineTotal > 0 ? 'text-amber-300' : 'text-white'}`}>
              ₹{pendingFineTotal}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">₹5 per day overdue rate</p>
        </div>
      </div>

      {/* Fine Alert Banner if any overdue */}
      {pendingFineTotal > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800/80 text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-amber-300">Outstanding Library Dues Notice: ₹{pendingFineTotal}</h4>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              You have {overdueLoans.length} overdue item(s) incurring overdue charges at ₹5/day according to college borrowing rules. Please return books to the circulation desk promptly.
            </p>
          </div>
        </div>
      )}

      {/* Current Borrowed Books with Countdown Timers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Current Borrowed Books &amp; Due Countdowns</h3>
          </div>
          <span className="text-xs text-slate-400">Standard 14-day borrowing loan</span>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            You currently have no borrowed books. Check the catalog to reserve titles!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map((loan) => {
              const countdown = calculateRemainingCountdown(loan.dueDate);
              return (
                <div
                  key={loan.id}
                  className={`p-5 bg-slate-900 border rounded-2xl shadow-lg relative overflow-hidden transition-all ${
                    countdown.isOverdue 
                      ? 'border-rose-800/80 bg-rose-950/20' 
                      : countdown.isUrgent 
                      ? 'border-amber-700/80 bg-amber-950/20' 
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          ID: {loan.bookId}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          countdown.isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : countdown.isUrgent
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {loan.status}
                        </span>
                      </div>

                      <h4 
                        onClick={() => onSelectBookByTitleId(loan.bookTitleId)}
                        className="text-base font-bold text-white hover:text-emerald-300 cursor-pointer transition-colors leading-snug"
                      >
                        {loan.bookTitle}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Txn #{loan.transactionId} &bull; Issued by {loan.issuedBy}
                      </p>
                    </div>
                  </div>

                  {/* Countdown Highlight Box */}
                  <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
                    countdown.isOverdue
                      ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                      : countdown.isUrgent
                      ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200'
                  }`}>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Return Countdown</div>
                      <div className={`font-extrabold text-sm ${
                        countdown.isOverdue ? 'text-rose-300' : countdown.isUrgent ? 'text-amber-300' : 'text-emerald-300'
                      }`}>
                        {countdown.text}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Due Date</div>
                      <div className="font-semibold text-slate-200">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {loan.fineAmount > 0 && (
                    <div className="mt-2 text-right text-xs font-bold text-rose-400">
                      Current Overdue Fine: ₹{loan.fineAmount} ({loan.overdueDays} days late)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Reservations with Pickup Deadlines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white">Active Online Book Reservations</h3>
          </div>
          <span className="text-xs text-slate-400">48-Hour Pickup Window</span>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            No active reservations. Browse books in the catalog to reserve ahead of time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReservations.map((res) => (
              <div
                key={res.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Copy ID: {res.bookId}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {res.status}
                      </span>
                    </div>

                    <h4 
                      onClick={() => onSelectBookByTitleId(res.bookTitleId)}
                      className="text-base font-bold text-white hover:text-emerald-300 cursor-pointer transition-colors leading-snug"
                    >
                      {res.bookTitle}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Reservation #{res.reservationId}</p>
                  </div>

                  <button
                    onClick={() => handleCancelReservation(res.id)}
                    disabled={cancellingId === res.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Cancel Reservation"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Pickup Deadline</div>
                    <div className="font-bold text-amber-300">
                      {calculatePickupRemaining(res.pickupDeadline)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Collect Before</div>
                    <div className="font-medium text-slate-200">
                      {new Date(res.pickupDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Recommendations based on library data heuristics */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Recommended for Your Studies</h3>
                <p className="text-xs text-slate-400">Heuristic matching based on your department &amp; reading history</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map(({ book, reason }) => (
              <div
                key={book.id}
                onClick={() => onSelectBookByTitleId(book.id)}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl shadow transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-40 object-cover rounded-xl shadow mb-3 group-hover:scale-102 transition-transform"
                  />
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 block truncate mb-1">
                    {reason}
                  </span>
                  <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 line-clamp-2 leading-snug">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">by {book.author}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 font-semibold">{book.availableCopies} available</span>
                  <span className="text-slate-500 font-mono text-[10px]">{book.shelfNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Borrowing History Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-white">Borrowing &amp; Return History</h3>
          </div>
          <span className="text-xs text-slate-400">Completed circulation logs</span>
        </div>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow">
          {pastHistory.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No completed return records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Txn ID</th>
                    <th className="py-3 px-4">Book Title</th>
                    <th className="py-3 px-4 font-mono">8-Digit ID</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Return Date</th>
                    <th className="py-3 px-4">Fine Incurred</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pastHistory.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-slate-400">{txn.transactionId}</td>
                      <td className="py-3 px-4 font-semibold text-white">{txn.bookTitle}</td>
                      <td className="py-3 px-4 font-mono text-emerald-300 font-bold">{txn.bookId}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(txn.issueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-slate-300">{txn.returnDate ? new Date(txn.returnDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {txn.fineAmount > 0 ? (
                          <span className="text-rose-300 font-semibold">₹{txn.fineAmount} (Paid)</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">₹0 (On Time)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                          RETURNED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
