import React from 'react';
import { PlantSummaryKpi, CalculatedProcess, ProductionParams } from '../types';
import { ExecutiveBriefing } from './ExecutiveBriefing';
import { X, FileText } from 'lucide-react';

interface ExecutiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantKpi: PlantSummaryKpi;
  lineACalculated: CalculatedProcess[];
  lineBCalculated: CalculatedProcess[];
  lineAParams: ProductionParams;
  lineBParams: ProductionParams;
}

export const ExecutiveModal: React.FC<ExecutiveModalProps> = ({
  isOpen,
  onClose,
  plantKpi,
  lineACalculated,
  lineBCalculated,
  lineAParams,
  lineBParams,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-700 bg-slate-950/80 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                รายงานสรุปสำหรับผู้จัดการโรงงาน (Plant Manager Executive Briefing)
              </h2>
              <p className="text-xs text-slate-400">
                วิเคราะห์สถานการณ์กำลังคน ความพร้อมตามแผนผลิต และข้อเสนอแนะเชิงบริหาร
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          <ExecutiveBriefing
            plantKpi={plantKpi}
            lineACalculated={lineACalculated}
            lineBCalculated={lineBCalculated}
            lineAParams={lineAParams}
            lineBParams={lineBParams}
            compact={false}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
