import React from 'react';
import { X, Calculator, HelpCircle, CheckCircle2 } from 'lucide-react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  taktTime: number;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({
  isOpen,
  onClose,
  taktTime,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">
              สูตรและหลักการคำนวณกำลังคน (Manpower Intelligence IE Calculation)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          {/* 1. Takt Time Formula */}
          <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-400 text-xs uppercase tracking-wider">
                1. สูตรคำนวณ Takt Time (เวลาต่อชิ้นตามจังหวะความต้องการ)
              </span>
              <span className="text-xs font-mono text-slate-400">
                ปัจจุบัน = {taktTime.toFixed(2)} วินาที
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-center text-blue-300 text-sm">
              Takt Time (วินาที) = (Work Time × Efficiency) ÷ (Daily Plan ÷ Shifts)
            </div>
            <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
              <li>
                <strong className="text-slate-300">Work Time:</strong> เวลาทำงานทั้งหมดต่อกะ (วินาที) เช่น 8 ชั่วโมง = 28,800 วินาที
              </li>
              <li>
                <strong className="text-slate-300">Efficiency (Eff %):</strong> ประสิทธิภาพโดยรวม เช่น 0.80 (80%)
              </li>
              <li>
                <strong className="text-slate-300">Plan per Shift:</strong> ยอดแผนการผลิตต่อวันหารด้วยจำนวนกะ (Daily Plan ÷ Shifts)
              </li>
            </ul>
          </div>

          {/* 2. Cycle Time & MP Required Formula */}
          <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-lg space-y-2">
            <span className="font-semibold text-emerald-400 text-xs uppercase tracking-wider">
              2. สูตรคำนวณ MP Required (กำลังคนที่ต้องการในแต่ละกระบวนการ)
            </span>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-center text-emerald-300 text-sm space-y-1">
              <div>Cycle Time (CT) = 3,600 วินาที ÷ UPH</div>
              <div className="text-blue-300 font-bold">
                MP Required = Cycle Time ÷ Takt Time
              </div>
            </div>
            <p className="text-xs text-slate-400">
              ตัวอย่าง: UPH = 100 ชิ้น/ชม. → CT = 3600 ÷ 100 = 36 วินาที หาก Takt Time = 13.28 วินาที → MP Req = 36 ÷ 13.28 ≈ 2.71 คน
            </p>
          </div>

          {/* 3. Gap & Status Decision Matrix */}
          <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-lg space-y-2">
            <span className="font-semibold text-amber-400 text-xs uppercase tracking-wider">
              3. เกณฑ์การประเมินสถานะกำลังคน (Gap = MP Actual − MP Required)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-lg">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> สมดุล (Balanced)
                </span>
                <p className="text-[11px] text-slate-300 mt-1">
                  เมื่อ Gap อยู่ระหว่าง <strong>-1.0 ถึง +1.0</strong> กำลังคนพอเหมาะกับจังหวะงาน
                </p>
              </div>

              <div className="p-3 bg-rose-950/40 border border-rose-700/60 rounded-lg">
                <span className="text-xs font-bold text-rose-400">
                  ⚠️ คนขาด (Shortage)
                </span>
                <p className="text-[11px] text-slate-300 mt-1">
                  เมื่อ Gap <strong>น้อยกว่า -1.0</strong> คนไม่พอกับปริมาณงาน เสี่ยงผลิตไม่ทันเป้า
                </p>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-700/60 rounded-lg">
                <span className="text-xs font-bold text-amber-400">
                  ⚡ คนเกิน (Surplus)
                </span>
                <p className="text-[11px] text-slate-300 mt-1">
                  เมื่อ Gap <strong>มากกว่า +1.0</strong> มีกำลังคนเกินความต้องการ สามารถเกลี่ยไปสายอื่นได้
                </p>
              </div>
            </div>
          </div>

          {/* Haier Multi-Line Note */}
          <div className="p-3 bg-slate-900/50 rounded border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong className="text-slate-200">มาตรฐาน HAIER Line A:</strong> โครงสร้างมาตรฐาน (STD) รวมทุกกระบวนการอยู่ที่ 310 คน ยอดแผนผลิตมาตรฐาน 3,470 ชิ้น/วัน (2 กะ, Eff 80%)
                </p>
                <p className="mt-1">
                  <strong className="text-slate-200">มาตรฐาน HAIER Line B:</strong> โครงสร้างมาตรฐาน (STD) รวมทุกกระบวนการอยู่ที่ 252 คน ยอดแผนผลิตมาตรฐาน 2,850 ชิ้น/วัน (2 กะ, Eff 82%)
                </p>
                <p className="mt-1 text-slate-300">
                  <strong className="text-amber-400">Sheet Summary Dashboard:</strong> รวมผลการคำนวณกำลังคนทั้งโรงงาน = Line A + Line B พร้อมตารางเปรียบเทียบมาตรฐานและเครื่องมือจำลอง What-If
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
