import React, { useState } from 'react';
import { 
  Search, 
  Hash, 
  BookOpen, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  MapPin, 
  Tag, 
  Building2,
  X
} from 'lucide-react';
import { Book, BookCopy } from '../types.js';

interface BookSearchProps {
  books: (Book & { copies: BookCopy[] })[];
  categories: string[];
  departments: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (avail: string) => void;
  onSelectBook: (book: Book & { copies: BookCopy[] }) => void;
  onOpenQR: (copy: BookCopy, bookTitle: string, author: string) => void;
  onDirect8DigitSearch: (id: string) => void;
}

export const BookSearch: React.FC<BookSearchProps> = ({
  books,
  categories,
  departments,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedDepartment,
  setSelectedDepartment,
  availabilityFilter,
  setAvailabilityFilter,
  onSelectBook,
  onOpenQR,
  onDirect8DigitSearch
}) => {
  const [searchMode, setSearchMode] = useState<'ALL' | '8DIGIT'>('ALL');
  const [eightDigitInput, setEightDigitInput] = useState('');
  const [digitError, setDigitError] = useState<string | null>(null);

  const sample8DigitIds = ['58274103', '19482031', '43920194', '77291048', '88392014'];

  const handle8DigitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = eightDigitInput.trim();
    if (!/^\d{8}$/.test(cleanId)) {
      setDigitError('Book ID must be exactly 8 numeric digits (e.g. 58274103)');
      return;
    }
    setDigitError(null);
    onDirect8DigitSearch(cleanId);
  };

  const handleQuickChipClick = (id: string) => {
    setEightDigitInput(id);
    setDigitError(null);
    onDirect8DigitSearch(id);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Search Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1829] via-[#621708]/30 to-[#072418] border border-amber-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#621708] text-amber-200 text-xs font-semibold mb-3 border border-amber-500/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            HITS Central Library &bull; Dr. K.C.G. Verghese Research &amp; Resource Centre
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Find, Reserve &amp; Borrow Physical Books at HITS
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Every physical book across our 65,000 sq. ft. Founder's Block library is tagged with a unique 8-digit Book ID. Search directly by physical copy ID or browse by academic discipline, author, and department.
          </p>

          {/* Search Mode Selector */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => { setSearchMode('ALL'); setDigitError(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                searchMode === 'ALL'
                  ? 'bg-[#009D4E] text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              Search by Title, Author, ISBN or Subject
            </button>
            <button
              onClick={() => { setSearchMode('8DIGIT'); setDigitError(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                searchMode === '8DIGIT'
                  ? 'bg-[#621708] text-amber-100 border border-amber-400/50 shadow-lg shadow-red-950/50'
                  : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Hash className="w-4 h-4 text-amber-300" />
              Direct 8-Digit Book ID Lookup
            </button>
          </div>

          {/* Search Inputs */}
          {searchMode === '8DIGIT' ? (
            <form onSubmit={handle8DigitSubmit} className="mt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Hash className="w-5 h-5 absolute left-3.5 top-3.5 text-emerald-400" />
                  <input
                    type="text"
                    maxLength={8}
                    value={eightDigitInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEightDigitInput(val);
                      setDigitError(null);
                    }}
                    placeholder="Enter exactly 8 numeric digits (e.g. 58274103)"
                    className="w-full bg-slate-950/90 border-2 border-emerald-500/50 rounded-2xl pl-11 pr-4 py-3 text-base text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-emerald-400 shadow-inner"
                  />
                  {eightDigitInput && (
                    <button
                      type="button"
                      onClick={() => setEightDigitInput('')}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-900/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Lookup Book Copy
                </button>
              </div>

              {digitError && (
                <p className="text-rose-400 text-xs mt-2 font-medium">{digitError}</p>
              )}

              {/* Sample 8-Digit Pills */}
              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Try Sample 8-Digit IDs:</span>
                {sample8DigitIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleQuickChipClick(id)}
                    className="font-mono text-emerald-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 hover:border-emerald-500 transition-colors"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </form>
          ) : (
            <div className="mt-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by book title, author, ISBN (978-...), subject or shelf code..."
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Quick Keywords */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                <span className="text-slate-500">Popular:</span>
                {['Database', 'Algorithms', 'Operating Systems', 'Artificial Intelligence', 'Networks', 'Cloud'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md border border-slate-700/60 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Department:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 max-w-xs truncate"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available for Reservation</option>
              <option value="UNAVAILABLE">Currently Issued / Waitlist</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 font-medium">
          Showing <strong className="text-emerald-400 font-bold">{books.length}</strong> titles
        </div>
      </div>

      {/* Catalog Grid */}
      {books.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No books found matching your criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your search terms, searching by 8-digit Book ID, or resetting your category and department filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedDepartment('ALL');
              setAvailabilityFilter('ALL');
            }}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            const isAvail = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-xl flex flex-col group"
              >
                {/* Top Section with Cover & Badges */}
                <div className="p-5 flex gap-4 border-b border-slate-800/80">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-24 h-36 object-cover rounded-xl shadow-md border border-slate-800 shrink-0 group-hover:scale-102 transition-transform"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 truncate">
                          {book.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isAvail
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isAvail ? `${book.availableCopies} Avail` : 'Waitlist'}
                        </span>
                      </div>

                      <h3 
                        onClick={() => onSelectBook(book)}
                        className="font-bold text-sm text-white hover:text-emerald-300 transition-colors line-clamp-2 cursor-pointer leading-snug"
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">by {book.author}</p>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-2">
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{book.shelfNumber}</span>
                        <span className="text-slate-500">&bull; {book.location}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ISBN: <span className="font-mono text-slate-400">{book.isbn}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Physical Copies 8-Digit Preview Chips */}
                <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-emerald-400" />
                      Physical 8-Digit Copies:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {book.copies?.length || 0} copies registered
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {book.copies && book.copies.length > 0 ? (
                      book.copies.slice(0, 4).map((copy) => (
                        <span
                          key={copy.bookId}
                          onClick={() => onOpenQR(copy, book.title, book.author)}
                          className={`font-mono text-[11px] px-2 py-0.5 rounded cursor-pointer border flex items-center gap-1 transition-colors ${
                            copy.status === 'AVAILABLE'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:border-emerald-400'
                              : copy.status === 'RESERVED'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:border-amber-400'
                              : copy.status === 'OVERDUE'
                              ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                          title={`Copy ${copy.copyNumber} - Status: ${copy.status}. Click to view QR.`}
                        >
                          <span className="font-bold">{copy.bookId}</span>
                          <span className="text-[9px] opacity-75">({copy.status.slice(0, 3)})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">No copy IDs</span>
                    )}
                    {(book.copies?.length || 0) > 4 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">
                        +{book.copies.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 mt-auto flex items-center justify-between gap-2 bg-slate-900/90">
                  <button
                    onClick={() => onSelectBook(book)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Details &amp; Copies
                  </button>

                  <button
                    onClick={() => onSelectBook(book)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isAvail
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-amber-600/90 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {isAvail ? 'Reserve Book' : 'Waitlist'}
                  </button>

                  {book.copies && book.copies[0] && (
                    <button
                      onClick={() => onOpenQR(book.copies[0], book.title, book.author)}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                      title="Generate Spine QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
