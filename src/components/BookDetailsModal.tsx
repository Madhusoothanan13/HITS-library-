import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  QrCode, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  BookmarkCheck, 
  Hash, 
  Layers, 
  Tag, 
  Info,
  Wrench
} from 'lucide-react';
import { Book, BookCopy, User, Student } from '../types.js';
import { createReservationApi, joinWaitlistApi } from '../services/api.js';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: (Book & { copies: BookCopy[] }) | null;
  user: User | null;
  student: Student | null;
  onOpenQR: (copy: BookCopy, bookTitle: string, author: string) => void;
  onActionSuccess: (message: string) => void;
  onNeedLogin: () => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  isOpen,
  onClose,
  book,
  user,
  student,
  onOpenQR,
  onActionSuccess,
  onNeedLogin
}) => {
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !book) return null;

  const availableCopies = book.copies?.filter(c => c.status === 'AVAILABLE') || [];
  const isAllUnavailable = availableCopies.length === 0;

  const handleReserve = async (targetCopyId?: string) => {
    if (!user) {
      onNeedLogin();
      return;
    }
    setLoading(true);
    setActionError(null);
    try {
      const copyId = targetCopyId || (availableCopies[0]?.bookId);
      const res = await createReservationApi({
        bookTitleId: book.id,
        bookId: copyId
      });
      onActionSuccess(`Book reserved successfully! Reservation ID: ${res.reservation.reservationId}. Please collect Book ID ${res.copy.bookId} within 48 hours.`);
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      onNeedLogin();
      return;
    }
    setLoading(true);
    setActionError(null);
    try {
      const res = await joinWaitlistApi(book.id);
      onActionSuccess(`Joined waitlist at Position #${res.waitlistEntry.position}. You will be notified the moment a copy is checked in.`);
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081220] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#621708] text-amber-300 border border-amber-500/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">HITS Book Information &amp; Circulation</h3>
              <p className="text-xs text-emerald-400">Dr. K.C.G. Verghese Central Library &bull; 8-Digit Physical Copies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="font-semibold block">Reservation Notice:</strong>
                {actionError}
              </div>
            </div>
          )}

          {/* Book Primary Overview */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-44 shrink-0 flex flex-col items-center">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-40 h-56 object-cover rounded-xl shadow-lg border border-slate-700/80"
              />
              <div className="mt-2 text-center text-xs text-slate-400">
                <span>ISBN: </span>
                <span className="font-mono text-slate-300">{book.isbn}</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {book.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {book.edition} &bull; {book.publisher}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">{book.title}</h2>
                <p className="text-xs text-slate-300 font-medium mt-1">by {book.author}</p>
              </div>

              {/* Shelf & Location Bar */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Shelf Number</div>
                    <div className="font-bold text-emerald-300">{book.shelfNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Stack Location</div>
                  <div className="text-slate-300 font-medium">{book.location}</div>
                </div>
              </div>

              {/* Department & Subject */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">Subject Area</span>
                  <span className="text-slate-200 font-medium truncate block">{book.subject}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">Department</span>
                  <span className="text-slate-200 font-medium truncate block">{book.department}</span>
                </div>
              </div>

              {book.description && (
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {book.description}
                </p>
              )}
            </div>
          </div>

          {/* Physical Copies Section (Unique 8-Digit IDs) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Physical Copy Records (8-Digit Book IDs)</h4>
              </div>
              <div className="text-xs text-slate-400">
                <span className="text-emerald-400 font-bold">{book.availableCopies}</span> of {book.totalCopies} copies available
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Copy #</th>
                    <th className="py-2.5 px-3 font-mono">8-Digit Book ID</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Expected Return / Info</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {book.copies && book.copies.length > 0 ? (
                    book.copies.map((copy) => {
                      const isAvail = copy.status === 'AVAILABLE';
                      return (
                        <tr 
                          key={copy.bookId}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            selectedCopyId === copy.bookId ? 'bg-emerald-950/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-400">Copy {copy.copyNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                            {copy.bookId}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 capitalize">{copy.condition?.toLowerCase()}</td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              copy.status === 'AVAILABLE' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : copy.status === 'RESERVED'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : copy.status === 'OVERDUE'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : copy.status === 'MAINTENANCE'
                                ? 'bg-slate-700/50 text-slate-400 border border-slate-600'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {copy.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {(copy as any).expectedReturnDate ? (
                              <span className="text-[11px] text-amber-300 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {new Date((copy as any).expectedReturnDate).toLocaleDateString()}
                              </span>
                            ) : copy.status === 'AVAILABLE' ? (
                              <span className="text-[11px] text-emerald-400">Ready at {copy.shelfNumber}</span>
                            ) : copy.status === 'MAINTENANCE' ? (
                              <span className="text-[11px] text-slate-500">Under restoration</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">In circulation</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenQR(copy, book.title, book.author)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
                                title="Show Physical Book QR Spine Label"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              {isAvail && (
                                <button
                                  onClick={() => handleReserve(copy.bookId)}
                                  disabled={loading}
                                  className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors"
                                >
                                  Reserve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                        No physical copy records assigned yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {book.availableCopies > 0 ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Available for Online Reservation (14-day loan)
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                All copies currently in circulation. Waitlist open.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {book.availableCopies > 0 ? (
              <button
                onClick={() => handleReserve()}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4" />
                {loading ? 'Processing...' : 'Reserve Available Book'}
              </button>
            ) : (
              <button
                onClick={handleJoinWaitlist}
                disabled={loading}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-900/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                {loading ? 'Processing...' : 'Join Waitlist Queue'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
