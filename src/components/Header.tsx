import React, { useRef, useState } from 'react';
import {
  Factory,
  RotateCcw,
  Download,
  Info,
  CheckCircle,
  Loader2,
  Upload,
  FileJson,
  Layers,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { ActiveTab, LineId } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  viewMode: 'core' | 'full';
  onToggleViewMode: (mode: 'core' | 'full') => void;
  onReset: () => void;
  onExportCurrentLine: () => void;
  onExportConsolidatedCsv: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onOpenFormula: () => void;
  onOpenExecutiveModal: () => void;
  shifts: number;
  isSaving: boolean;
  lastSavedAt: string;
  lineAActual: number;
  lineBActual: number;
  totalActual: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  viewMode,
  onToggleViewMode,
  onReset,
  onExportCurrentLine,
  onExportConsolidatedCsv,
  onExportJson,
  onImportJson,
  onOpenFormula,
  onOpenExecutiveModal,
  shifts,
  isSaving,
  lastSavedAt,
  lineAActual,
  lineBActual,
  totalActual,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <header className="space-y-4 border-b border-slate-700/80 pb-4">
      {/* Top Bar: Brand, Title, Auto-save status, Export & Backup controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-950/70 border border-blue-500/30 rounded-xl text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <Factory className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                HAIER MANUFACTURING
              </span>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded">
                PLANT INTELLIGENCE
              </span>

              {/* Auto-save live indicator */}
              <span
                id="auto-save-indicator"
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded transition-all ${
                  isSaving
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>บันทึกอัตโนมัติแล้ว ({lastSavedAt})</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-blue-400 tracking-tight mt-1">
              HAIER - MP Intelligence Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              ระบบคำนวณและวิเคราะห์กำลังคนตาม Production Plan (Line A, Line B &amp; Sheet Summary Dashboard)
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col lg:items-end gap-2">
          <div className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3">
            <span>
              <span className="text-slate-500">รอบข้อมูล:</span>{' '}
              <strong className="text-slate-200">21 Sep 2026</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span>
              <span className="text-slate-500">Shift:</span>{' '}
              <strong className="text-slate-200">{shifts} กะ/วัน</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span>
              <span className="text-slate-500">กำลังคนรวมโรงงาน:</span>{' '}
              <strong className="text-emerald-400 font-mono">{totalActual} คน</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle (Available when in Line A or Line B) */}
            {activeTab !== 'summary' && (
              <div className="inline-flex p-0.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs">
                <button
                  id="toggle-core-view"
                  type="button"
                  onClick={() => onToggleViewMode('core')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'core'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4 รายการหลัก
                </button>
                <button
                  id="toggle-full-view"
                  type="button"
                  onClick={() => onToggleViewMode('full')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    viewMode === 'full'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  เต็มสายการผลิต
                </button>
              </div>
            )}

            {/* Executive Management Briefing button */}
            <button
              id="open-executive-modal-btn"
              type="button"
              onClick={onOpenExecutiveModal}
              title="เปิดข้อสรุปสถานการณ์สำหรับส่งรายงานผู้จัดการโรงงาน"
              className="p-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white border border-blue-500/40 rounded-lg transition-all flex items-center gap-1.5 text-xs px-2.5 font-semibold shadow-md shadow-blue-950/50"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>ข้อสรุป ผจก.โรงงาน</span>
            </button>

            {/* Formula button */}
            <button
              id="open-formula-modal"
              type="button"
              onClick={onOpenFormula}
              title="ดูสูตรการคำนวณ Manpower"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs px-2.5"
            >
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>สูตรคำนวณ</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs px-2.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>ส่งออก CSV</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isExportMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-30 animate-fade-in"
                  onMouseLeave={() => setIsExportMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onExportCurrentLine();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-between"
                  >
                    <span>
                      ส่งออก Sheet ปัจจุบัน (
                      {activeTab === 'lineA'
                        ? 'Line A'
                        : activeTab === 'lineB'
                        ? 'Line B'
                        : 'Summary'}
                      )
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onExportConsolidatedCsv();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-blue-300 hover:bg-slate-800 transition-colors font-medium border-t border-slate-800 flex items-center justify-between"
                  >
                    <span>ส่งออกรายงานรวมทั้งโรงงาน (A+B)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Backup / Export JSON */}
            <button
              type="button"
              onClick={onExportJson}
              title="สำรองข้อมูลทั้งหมด (Line A + Line B) เป็น JSON"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs px-2.5"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>สำรอง JSON</span>
            </button>

            {/* Import JSON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="กู้คืนข้อมูลจากไฟล์ JSON ที่สำรองไว้"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs px-2.5"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>กู้คืน</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Reset */}
            <button
              id="reset-defaults-btn"
              type="button"
              onClick={onReset}
              title="รีเซ็ตค่ากลับเป็นค่าตั้งต้นโรงงาน Haier"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Tabs Bar (Excel/Google Sheets-style industrial tabs navigation) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-0 overflow-x-auto">
        {/* Tab 1: Sheet Line A */}
        <button
          type="button"
          onClick={() => onSelectTab('lineA')}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all shrink-0 ${
            activeTab === 'lineA'
              ? 'bg-slate-800 border-blue-500/70 text-blue-400 border-b-2 border-b-blue-500 shadow-sm'
              : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Sheet 1: Line A (ตู้เย็นสาย A)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-slate-300 border border-slate-700 rounded font-mono">
            {lineAActual} คน
          </span>
        </button>

        {/* Tab 2: Sheet Line B */}
        <button
          type="button"
          onClick={() => onSelectTab('lineB')}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all shrink-0 ${
            activeTab === 'lineB'
              ? 'bg-slate-800 border-emerald-500/70 text-emerald-400 border-b-2 border-b-emerald-500 shadow-sm'
              : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Sheet 2: Line B (ตู้เย็นสาย B)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-slate-300 border border-slate-700 rounded font-mono">
            {lineBActual} คน
          </span>
        </button>

        {/* Tab 3: Sheet Summary Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('summary')}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-t border-x transition-all shrink-0 ${
            activeTab === 'summary'
              ? 'bg-slate-800 border-amber-500/70 text-amber-400 border-b-2 border-b-amber-500 shadow-sm'
              : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Sheet 3: Summary Dashboard (สรุปรวม Line A + B)</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-amber-950/70 text-amber-300 border border-amber-700/60 rounded font-mono">
            รวม {totalActual} คน
          </span>
        </button>
      </div>
    </header>
  );
};
