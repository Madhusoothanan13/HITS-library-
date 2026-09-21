import React, { useEffect, useState } from 'react';
import { X, CreditCard, ShieldCheck, Printer, Calendar, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../types.js';
import { HitsLogo } from './HitsLogo.js';

interface DigitalLibraryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export const DigitalLibraryCardModal: React.FC<DigitalLibraryCardModalProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      const cardPayload = JSON.stringify({
        system: 'HITS Central Library - Dr. K.C.G. Verghese Research & Resource Centre',
        university: 'Hindustan Institute of Technology and Science',
        type: 'STUDENT_DIGITAL_ID',
        rollNo: student.rollNo,
        name: student.name,
        cardNo: student.libraryCardNumber,
        dept: student.department,
        status: student.status
      });

      QRCode.toDataURL(cardPayload, {
        margin: 1,
        scale: 4,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(setQrUrl);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0c1829] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#081220]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#621708] text-amber-300 border border-amber-500/40">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">HITS Student Digital Library Card</h3>
              <p className="text-[11px] text-slate-400">Dr. K.C.G. Verghese Research &amp; Resource Centre</p>
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
        <div className="p-6">
          {/* Card Component with HITS Brand Colors: Mahogany & Green Haze & Gold */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#0c192e] via-[#621708]/35 to-[#0b1f16] border-2 border-amber-500/40 p-6 text-white select-none">
            {/* Institution Header */}
            <div className="flex items-start justify-between border-b border-amber-500/30 pb-3.5 mb-3.5">
              <div className="flex items-center gap-2.5">
                <HitsLogo size="sm" showText={false} />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-200">
                    Hindustan Institute of Technology &amp; Science
                  </h4>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    Dr. K.C.G. Verghese Research &amp; Resource Centre
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Padur, Chennai - 603 103 &bull; Deemed to be University
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#009D4E]/30 text-emerald-300 border border-[#009D4E] uppercase">
                  <ShieldCheck className="w-3 h-3" />
                  {student.status}
                </span>
              </div>
            </div>

            {/* Body Info & QR */}
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Student Details */}
              <div className="col-span-2 space-y-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Student Name</div>
                  <div className="text-base font-bold text-white tracking-tight leading-snug">{student.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Roll No</div>
                    <div className="font-mono font-bold text-emerald-300">{student.rollNo}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Semester</div>
                    <div className="font-medium text-slate-200">{student.semester}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Department</div>
                  <div className="text-xs text-slate-200 font-medium truncate">{student.department}</div>
                </div>

                <div className="pt-1 flex items-center gap-3 text-[10px] text-slate-300">
                  <span>Borrow Limit: <strong className="text-amber-300">{student.maxBorrowLimit} Books</strong></span>
                  <span>&bull;</span>
                  <span>Duration: <strong className="text-emerald-400">14 Days</strong></span>
                </div>
              </div>

              {/* Student QR & Card No */}
              <div className="col-span-1 flex flex-col items-center justify-center text-center pl-2 border-l border-slate-700/60">
                {qrUrl ? (
                  <div className="p-1.5 bg-white rounded-xl shadow-md border border-amber-500/40">
                    <img src={qrUrl} alt="HITS Student Library Card QR" className="w-24 h-24 object-contain" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-slate-800 rounded-xl animate-pulse" />
                )}
                <div className="text-[9px] font-mono text-amber-300 mt-1.5 font-bold tracking-tight">
                  {student.libraryCardNumber}
                </div>
              </div>
            </div>

            {/* Footer barcode emulation */}
            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Issue: {new Date(student.registeredAt).toLocaleDateString()}</span>
              </div>
              <div className="font-mono tracking-widest text-[9px] text-emerald-400/80">
                || | ||| || |||| | ||| || |||| |||
              </div>
              <div className="text-amber-300/90 font-medium">Valid AY 2026-27</div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-5 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Show this pass at Founder's Block circulation counter to issue books</span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-[#621708] hover:bg-[#7a1c0d] text-amber-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/40 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
