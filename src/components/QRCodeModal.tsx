import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Check, MapPin, Hash, BookMarked, ShieldCheck } from 'lucide-react';
import { getBookQrCodeApi } from '../services/api.js';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string; // 8-digit physical Book ID
  bookTitle: string;
  author: string;
  shelfNumber: string;
  location: string;
  status: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  author,
  shelfNumber,
  location,
  status
}) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && bookId) {
      setLoading(true);
      getBookQrCodeApi(bookId)
        .then((res) => {
          setQrUrl(res.qrDataUrl);
        })
        .catch((err) => {
          console.error('Failed to load QR code', err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, bookId]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(bookId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Physical Book QR Code</h3>
              <p className="text-[11px] text-slate-400">Library Spine Label Identifier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-center">
          {/* Printable Book Spine Card Preview */}
          <div className="p-4 bg-white text-slate-900 rounded-xl shadow-md border border-amber-500/30 inline-block w-full text-center mb-4">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#621708] pb-1 border-b border-slate-200 mb-2 flex items-center justify-center gap-1">
              <span>HITS Central Library &bull; Physical Spine Tag</span>
            </div>
            <div className="text-[9px] text-emerald-700 font-semibold mb-2">
              Dr. K.C.G. Verghese Research &amp; Resource Centre
            </div>

            {loading ? (
              <div className="w-48 h-48 mx-auto flex items-center justify-center bg-slate-100 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR code for Book ID ${bookId}`}
                className="w-48 h-48 mx-auto object-contain p-1 rounded border border-slate-100"
              />
            ) : (
              <div className="w-48 h-48 mx-auto flex items-center justify-center text-xs text-rose-500">
                Failed to generate QR
              </div>
            )}

            <div className="mt-2 text-center">
              <div className="text-xs font-mono font-bold tracking-widest text-slate-800 bg-slate-100 py-1 px-2 rounded inline-block">
                BOOK ID: {bookId}
              </div>
              <div className="text-[11px] font-semibold text-slate-800 mt-1 truncate px-2">
                {bookTitle}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Shelf: <span className="font-bold text-slate-700">{shelfNumber}</span> &bull; {location}
              </div>
            </div>
          </div>

          {/* Details summary */}
          <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 text-left text-xs space-y-1.5 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                8-Digit Book ID:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-emerald-300">{bookId}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white text-[10px]"
                  title="Copy 8-digit ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Shelf Location:
              </span>
              <span className="font-medium text-slate-200">{shelfNumber} ({location})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Inventory Status:
              </span>
              <span className="font-semibold text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                {status}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {qrUrl && (
              <a
                href={qrUrl}
                download={`Library-Book-${bookId}-QR.png`}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Spine Label
              </a>
            )}
            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
