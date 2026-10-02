/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  INITIAL_PROCESSES_LINE_A,
  INITIAL_PROCESSES_LINE_B,
  CORE_FOUR_PROCESSES_A,
  CORE_FOUR_PROCESSES_B,
  DEFAULT_PARAMS_LINE_A,
  DEFAULT_PARAMS_LINE_B,
} from './data/initialProcesses';
import {
  ProcessItem,
  ProductionParams,
  ActiveTab,
  LineId,
} from './types';
import { calculateManpower, calculatePlantSummary } from './utils/calculator';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { KpiCards } from './components/KpiCards';
import { ProcessTable } from './components/ProcessTable';
import { ProcessChart } from './components/ProcessChart';
import { SummaryDashboard } from './components/SummaryDashboard';
import { AddProcessModal } from './components/AddProcessModal';
import { FormulaModal } from './components/FormulaModal';
import { ExecutiveModal } from './components/ExecutiveModal';
import {
  loadSavedState,
  saveDashboardState,
  clearSavedDashboardState,
} from './utils/storage';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  // Load initial multi-line state from localStorage
  const [initialData] = useState(() => loadSavedState());

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialData.activeTab);

  // Line A state
  const [lineAParams, setLineAParams] = useState<ProductionParams>(initialData.lineA.params);
  const [lineAProcesses, setLineAProcesses] = useState<ProcessItem[]>(initialData.lineA.processes);
  const [lineAViewMode, setLineAViewMode] = useState<'core' | 'full'>(initialData.lineA.viewMode);

  // Line B state
  const [lineBParams, setLineBParams] = useState<ProductionParams>(initialData.lineB.params);
  const [lineBProcesses, setLineBProcesses] = useState<ProcessItem[]>(initialData.lineB.processes);
  const [lineBViewMode, setLineBViewMode] = useState<'core' | 'full'>(initialData.lineB.viewMode);

  // Auto-save tracking
  const [lastSavedAt, setLastSavedAt] = useState<string>(initialData.lastSavedAt);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<'current' | 'all'>('current');

  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect: Triggers on any parameter, process, or view mode change across Line A or Line B
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const savedTime = saveDashboardState({
        activeTab,
        lineA: {
          params: lineAParams,
          processes: lineAProcesses,
          viewMode: lineAViewMode,
        },
        lineB: {
          params: lineBParams,
          processes: lineBProcesses,
          viewMode: lineBViewMode,
        },
      });
      setLastSavedAt(savedTime);
      setIsSaving(false);
    }, 250);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    activeTab,
    lineAParams,
    lineAProcesses,
    lineAViewMode,
    lineBParams,
    lineBProcesses,
    lineBViewMode,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Real-time calculation for Line A, Line B, and consolidated Plant Summary
  const { lineACalculated, lineBCalculated, plantKpi } = useMemo(() => {
    return calculatePlantSummary(
      lineAProcesses,
      lineAParams,
      lineBProcesses,
      lineBParams
    );
  }, [lineAProcesses, lineAParams, lineBProcesses, lineBParams]);

  // Current active line helpers
  const currentLineId: LineId = activeTab === 'lineB' ? 'lineB' : 'lineA';
  const currentLineName =
    activeTab === 'lineA' ? 'Line A' : activeTab === 'lineB' ? 'Line B' : 'Summary';

  const currentParams = activeTab === 'lineB' ? lineBParams : lineAParams;
  const currentCalculatedList = activeTab === 'lineB' ? lineBCalculated : lineACalculated;
  const currentKpi = activeTab === 'lineB' ? plantKpi.lineBKpi : plantKpi.lineAKpi;
  const currentViewMode = activeTab === 'lineB' ? lineBViewMode : lineAViewMode;

  // Toggle View Mode for active line
  const handleToggleViewMode = (mode: 'core' | 'full') => {
    if (activeTab === 'lineA') {
      setLineAViewMode(mode);
      setLineAProcesses(mode === 'core' ? CORE_FOUR_PROCESSES_A : INITIAL_PROCESSES_LINE_A);
      showToast(
        mode === 'core'
          ? 'Line A: สลับเป็น 4 รายการหลัก'
          : 'Line A: สลับเป็นเต็มสาย (310 STD)'
      );
    } else if (activeTab === 'lineB') {
      setLineBViewMode(mode);
      setLineBProcesses(mode === 'core' ? CORE_FOUR_PROCESSES_B : INITIAL_PROCESSES_LINE_B);
      showToast(
        mode === 'core'
          ? 'Line B: สลับเป็น 4 รายการหลัก'
          : 'Line B: สลับเป็นเต็มสาย (252 STD)'
      );
    }
  };

  // Param update for current line
  const handleParamChange = (key: keyof ProductionParams, val: number) => {
    if (activeTab === 'lineA') {
      setLineAParams((prev) => ({ ...prev, [key]: val }));
    } else if (activeTab === 'lineB') {
      setLineBParams((prev) => ({ ...prev, [key]: val }));
    }
  };

  // Process updates for Line A
  const handleUpdateProcessLineA = (id: string, updates: Partial<ProcessItem>) => {
    setLineAProcesses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Process updates for Line B
  const handleUpdateProcessLineB = (id: string, updates: Partial<ProcessItem>) => {
    setLineBProcesses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // General update for active table
  const handleUpdateCurrentProcess = (id: string, updates: Partial<ProcessItem>) => {
    if (activeTab === 'lineA') {
      handleUpdateProcessLineA(id, updates);
    } else {
      handleUpdateProcessLineB(id, updates);
    }
  };

  // Process deletions
  const handleDeleteProcess = (id: string) => {
    if (activeTab === 'lineA') {
      setLineAProcesses((prev) => prev.filter((item) => item.id !== id));
      showToast('Line A: ลบกระบวนการเรียบร้อย');
    } else {
      setLineBProcesses((prev) => prev.filter((item) => item.id !== id));
      showToast('Line B: ลบกระบวนการเรียบร้อย');
    }
  };

  // Process addition
  const handleAddProcess = (newProc: ProcessItem) => {
    if (currentLineId === 'lineA') {
      setLineAProcesses((prev) => [...prev, { ...newProc, lineId: 'lineA' }]);
      showToast(`Line A: เพิ่มกระบวนการ "${newProc.name}" สำเร็จ`);
    } else {
      setLineBProcesses((prev) => [...prev, { ...newProc, lineId: 'lineB' }]);
      showToast(`Line B: เพิ่มกระบวนการ "${newProc.name}" สำเร็จ`);
    }
  };

  // Factory Reset
  const handleConfirmReset = () => {
    if (resetTarget === 'all') {
      clearSavedDashboardState();
      setLineAParams(DEFAULT_PARAMS_LINE_A);
      setLineAProcesses(INITIAL_PROCESSES_LINE_A);
      setLineAViewMode('full');

      setLineBParams(DEFAULT_PARAMS_LINE_B);
      setLineBProcesses(INITIAL_PROCESSES_LINE_B);
      setLineBViewMode('full');
      showToast('คืนค่าเริ่มต้นโรงงานทั้งหมด (Line A + Line B) เรียบร้อยแล้ว');
    } else if (activeTab === 'lineA') {
      setLineAParams(DEFAULT_PARAMS_LINE_A);
      setLineAProcesses(INITIAL_PROCESSES_LINE_A);
      setLineAViewMode('full');
      showToast('คืนค่าเริ่มต้น Line A (310 STD / 312 Act) เรียบร้อย');
    } else if (activeTab === 'lineB') {
      setLineBParams(DEFAULT_PARAMS_LINE_B);
      setLineBProcesses(INITIAL_PROCESSES_LINE_B);
      setLineBViewMode('full');
      showToast('คืนค่าเริ่มต้น Line B (252 STD / 255 Act) เรียบร้อย');
    }
    setIsResetConfirmOpen(false);
  };

  // Export CSV for current active sheet
  const handleExportCurrentLine = () => {
    if (activeTab === 'summary') {
      handleExportConsolidatedCsv();
      return;
    }

    const targetList = activeTab === 'lineA' ? lineACalculated : lineBCalculated;
    const targetKpi = activeTab === 'lineA' ? plantKpi.lineAKpi : plantKpi.lineBKpi;
    const targetLabel = activeTab === 'lineA' ? 'LineA' : 'LineB';

    const headers = [
      'Process',
      'Line',
      'UPH',
      'MP STD',
      'MP Actual',
      'Takt Time (s)',
      'MP Required',
      'Gap (Act - Req)',
      'Status',
    ];

    const rows = targetList.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.line,
      p.uph,
      p.std,
      p.act,
      targetKpi.taktTime.toFixed(1),
      p.mpReq.toFixed(1),
      p.gap.toFixed(1),
      p.status === 'balanced' ? 'สมดุล' : p.status === 'shortage' ? 'คนขาด' : 'คนเกิน',
    ]);

    rows.push([
      `"TOTAL / สรุปรวม ${targetLabel}"`,
      '-',
      '-',
      targetKpi.totalMpStd.toString(),
      targetKpi.totalMpAct.toString(),
      targetKpi.taktTime.toFixed(1),
      targetKpi.totalMpReq.toFixed(1),
      targetKpi.totalGap.toFixed(1),
      targetKpi.totalGap < -1 ? 'คนขาดแคลน' : targetKpi.totalGap > 1 ? 'คนเกิน' : 'สมดุล',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Haier_MP_${targetLabel}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`ส่งออกไฟล์ CSV ของ ${targetLabel} สำเร็จ`);
  };

  // Export Consolidated Multi-Sheet CSV (Plant Summary + Line A + Line B)
  const handleExportConsolidatedCsv = () => {
    const lines: string[] = [];

    // Header
    lines.push('HAIER REFRIGERATOR MANUFACTURING PLANT - MANPOWER INTELLIGENCE REPORT');
    lines.push(`Export Date: ${new Date().toLocaleString('th-TH')}`);
    lines.push('');

    // Summary section
    lines.push('=== 1. EXECUTIVE PLANT SUMMARY (สรุปรวมทั้งโรงงาน Line A + Line B) ===');
    lines.push('Parameter,Line A,Line B,Total Plant');
    lines.push(
      `Daily Plan (pcs),${lineAParams.dailyPlan},${lineBParams.dailyPlan},${plantKpi.totalDailyPlan}`
    );
    lines.push(`Shifts/Day,${lineAParams.shifts},${lineBParams.shifts},2`);
    lines.push(
      `Efficiency,${Math.round(lineAParams.efficiency * 100)}%,${Math.round(
        lineBParams.efficiency * 100
      )}%,-`
    );
    lines.push(
      `Takt Time (s),${plantKpi.lineAKpi.taktTime.toFixed(2)},${plantKpi.lineBKpi.taktTime.toFixed(
        2
      )},-`
    );
    lines.push(
      `MP Standard (STD),${plantKpi.lineAKpi.totalMpStd},${plantKpi.lineBKpi.totalMpStd},${plantKpi.totalMpStd}`
    );
    lines.push(
      `MP Actual (ACT),${plantKpi.lineAKpi.totalMpAct},${plantKpi.lineBKpi.totalMpAct},${plantKpi.totalMpAct}`
    );
    lines.push(
      `MP Required (REQ),${plantKpi.lineAKpi.totalMpReq.toFixed(
        1
      )},${plantKpi.lineBKpi.totalMpReq.toFixed(1)},${plantKpi.totalMpReq.toFixed(1)}`
    );
    lines.push(
      `Manpower Gap,${plantKpi.lineAKpi.totalGap.toFixed(1)},${plantKpi.lineBKpi.totalGap.toFixed(
        1
      )},${plantKpi.totalGap.toFixed(1)}`
    );
    lines.push(
      `Balancing Rate,${plantKpi.lineAKpi.balancingRate}%,${plantKpi.lineBKpi.balancingRate}%,${plantKpi.avgBalancingRate}%`
    );
    lines.push('');

    // Section 2: Line A Breakdown
    lines.push('=== 2. SHEET: LINE A DETAILED PROCESS BREAKDOWN ===');
    lines.push('Process,Line,UPH,MP STD,MP Actual,Takt Time (s),MP Req,Gap,Status');
    lineACalculated.forEach((p) => {
      lines.push(
        `"${p.name.replace(/"/g, '""')}",${p.line},${p.uph},${p.std},${p.act},${plantKpi.lineAKpi.taktTime.toFixed(
          1
        )},${p.mpReq.toFixed(1)},${p.gap.toFixed(1)},${
          p.status === 'balanced' ? 'สมดุล' : p.status === 'shortage' ? 'คนขาด' : 'คนเกิน'
        }`
      );
    });
    lines.push(
      `"TOTAL LINE A",-, -,${plantKpi.lineAKpi.totalMpStd},${plantKpi.lineAKpi.totalMpAct},${plantKpi.lineAKpi.taktTime.toFixed(
        1
      )},${plantKpi.lineAKpi.totalMpReq.toFixed(1)},${plantKpi.lineAKpi.totalGap.toFixed(1)},${
        plantKpi.lineAKpi.totalGap < -1 ? 'คนขาดแคลน' : plantKpi.lineAKpi.totalGap > 1 ? 'คนเกิน' : 'สมดุล'
      }`
    );
    lines.push('');

    // Section 3: Line B Breakdown
    lines.push('=== 3. SHEET: LINE B DETAILED PROCESS BREAKDOWN ===');
    lines.push('Process,Line,UPH,MP STD,MP Actual,Takt Time (s),MP Req,Gap,Status');
    lineBCalculated.forEach((p) => {
      lines.push(
        `"${p.name.replace(/"/g, '""')}",${p.line},${p.uph},${p.std},${p.act},${plantKpi.lineBKpi.taktTime.toFixed(
          1
        )},${p.mpReq.toFixed(1)},${p.gap.toFixed(1)},${
          p.status === 'balanced' ? 'สมดุล' : p.status === 'shortage' ? 'คนขาด' : 'คนเกิน'
        }`
      );
    });
    lines.push(
      `"TOTAL LINE B",-, -,${plantKpi.lineBKpi.totalMpStd},${plantKpi.lineBKpi.totalMpAct},${plantKpi.lineBKpi.taktTime.toFixed(
        1
      )},${plantKpi.lineBKpi.totalMpReq.toFixed(1)},${plantKpi.lineBKpi.totalGap.toFixed(1)},${
        plantKpi.lineBKpi.totalGap < -1 ? 'คนขาดแคลน' : plantKpi.lineBKpi.totalGap > 1 ? 'คนเกิน' : 'สมดุล'
      }`
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Haier_MP_Plant_Summary_AllLines_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ส่งออกรายงานรวมทั้งโรงงาน (A+B) สำเร็จ');
  };

  // Full JSON Backup
  const handleExportJson = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      activeTab,
      lineA: {
        params: lineAParams,
        processes: lineAProcesses,
        viewMode: lineAViewMode,
      },
      lineB: {
        params: lineBParams,
        processes: lineBProcesses,
        viewMode: lineBViewMode,
      },
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `haier_mp_multiline_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('สำรองข้อมูล JSON (Line A + Line B) เรียบร้อยแล้ว');
  };

  // Import JSON
  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.lineA && parsed.lineB) {
          if (parsed.lineA.params) setLineAParams(parsed.lineA.params);
          if (Array.isArray(parsed.lineA.processes)) setLineAProcesses(parsed.lineA.processes);
          if (parsed.lineA.viewMode) setLineAViewMode(parsed.lineA.viewMode);

          if (parsed.lineB.params) setLineBParams(parsed.lineB.params);
          if (Array.isArray(parsed.lineB.processes)) setLineBProcesses(parsed.lineB.processes);
          if (parsed.lineB.viewMode) setLineBViewMode(parsed.lineB.viewMode);

          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          showToast('กู้คืนข้อมูลครบทั้ง 2 สายการผลิตสำเร็จ');
        } else if (parsed.params && Array.isArray(parsed.processes)) {
          // Legacy format
          setLineAParams(parsed.params);
          setLineAProcesses(parsed.processes);
          if (parsed.viewMode) setLineAViewMode(parsed.viewMode);
          showToast('กู้คืนข้อมูลเข้าสู่ Line A สำเร็จ');
        } else {
          showToast('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        showToast('ไม่สามารถอ่านไฟล์ JSON ได้');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section with Multi-Sheet Tab Navigation */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          viewMode={currentViewMode}
          onToggleViewMode={handleToggleViewMode}
          onReset={() => {
            setResetTarget(activeTab === 'summary' ? 'all' : 'current');
            setIsResetConfirmOpen(true);
          }}
          onExportCurrentLine={handleExportCurrentLine}
          onExportConsolidatedCsv={handleExportConsolidatedCsv}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onOpenFormula={() => setIsFormulaModalOpen(true)}
          onOpenExecutiveModal={() => setIsExecutiveModalOpen(true)}
          shifts={currentParams.shifts}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          lineAActual={plantKpi.lineAKpi.totalMpAct}
          lineBActual={plantKpi.lineBKpi.totalMpAct}
          totalActual={plantKpi.totalMpAct}
        />

        {/* Tab Content Display */}
        {activeTab === 'summary' ? (
          /* Sheet 3: Summary Dashboard (Overall Plant A + B) */
          <SummaryDashboard
            plantKpi={plantKpi}
            lineACalculated={lineACalculated}
            lineBCalculated={lineBCalculated}
            lineAParams={lineAParams}
            lineBParams={lineBParams}
            onNavigateToLine={(lineId) => setActiveTab(lineId)}
            onUpdateProcessLineA={handleUpdateProcessLineA}
            onUpdateProcessLineB={handleUpdateProcessLineB}
          />
        ) : (
          /* Sheet 1: Line A OR Sheet 2: Line B */
          <div className="space-y-6">
            {/* Production Parameters Input Panel */}
            <InputPanel
              params={currentParams}
              onChange={handleParamChange}
              taktTime={currentKpi.taktTime}
              planPerShift={currentKpi.planPerShift}
            />

            {/* KPI Cards Section for Current Line */}
            <KpiCards kpi={currentKpi} />

            {/* Visual Analytics Chart for Current Line */}
            <ProcessChart
              processes={currentCalculatedList}
              taktTime={currentKpi.taktTime}
            />

            {/* Live Editable Process Breakdown Table */}
            <ProcessTable
              processes={currentCalculatedList}
              taktTime={currentKpi.taktTime}
              lineTitle={currentLineName}
              onUpdateProcess={handleUpdateCurrentProcess}
              onDeleteProcess={handleDeleteProcess}
              onAddNewProcess={() => setIsAddModalOpen(true)}
            />
          </div>
        )}

        {/* Plant Footer */}
        <footer className="text-center text-xs text-slate-500 pt-4 pb-2 border-t border-slate-800/80">
          <p>
            HAIER ELECTRICAL APPLIANCES (THAILAND) • REFRIGERATOR MANUFACTURING PLANT (LINE A &amp; LINE B)
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            IE Manpower Intelligence: Takt Time = (Work Time × Eff%) ÷ (Daily Plan ÷ Shifts) | MP Req = (3600 ÷ UPH) ÷ Takt Time
          </p>
        </footer>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg shadow-2xl text-xs font-medium animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add Process Modal */}
      <AddProcessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProcess}
        lineId={currentLineId}
        currentLineName={currentLineName}
      />

      {/* Formula & Calculation Logic Modal */}
      <FormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        taktTime={currentKpi.taktTime}
      />

      {/* Executive Briefing Modal for Plant Manager */}
      <ExecutiveModal
        isOpen={isExecutiveModalOpen}
        onClose={() => setIsExecutiveModalOpen(false)}
        plantKpi={plantKpi}
        lineACalculated={lineACalculated}
        lineBCalculated={lineBCalculated}
        lineAParams={lineAParams}
        lineBParams={lineBParams}
      />

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-base">
                ยืนยันการคืนค่าเริ่มต้น
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {resetTarget === 'all'
                ? 'ต้องการคืนค่าเริ่มต้นมาตรฐานโรงงาน Haier ทั้ง Line A (310 STD) และ Line B (252 STD) ใช่หรือไม่? การเปลี่ยนแปลงทั้งหมดจะถูกรีเซ็ต'
                : `ต้องการคืนค่าเริ่มต้นมาตรฐานโรงงาน Haier สำหรับ ${currentLineName} ใช่หรือไม่? ข้อมูลที่คุณแก้ไขในสายนี้จะถูกรีเซ็ต`}
            </p>

            {activeTab !== 'summary' && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetTarget === 'all'}
                    onChange={(e) => setResetTarget(e.target.checked ? 'all' : 'current')}
                    className="accent-blue-500 rounded"
                  />
                  <span>รีเซ็ตทุกสายการผลิตพร้อมกัน (All Lines)</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ยืนยันคืนค่า</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
