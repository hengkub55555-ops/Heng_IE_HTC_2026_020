import React, { useState } from 'react';
import { CalculatedProcess, ProcessItem } from '../types';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Edit3,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';

interface ProcessTableProps {
  processes: CalculatedProcess[];
  taktTime: number;
  lineTitle?: string;
  onUpdateProcess: (id: string, updates: Partial<ProcessItem>) => void;
  onDeleteProcess: (id: string) => void;
  onAddNewProcess: () => void;
  onManualSave?: () => void;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  taktTime,
  lineTitle = 'Line A',
  onUpdateProcess,
  onDeleteProcess,
  onAddNewProcess,
  onManualSave,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLine, setSelectedLine] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Get distinct lines
  const uniqueLines = ['All', ...Array.from(new Set(processes.map((p) => p.line)))];

  // Filtering
  const filteredProcesses = processes.filter((proc) => {
    const matchesSearch =
      proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proc.line.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proc.category && proc.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLine = selectedLine === 'All' || proc.line === selectedLine;
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'balanced' && proc.status === 'balanced') ||
      (selectedStatus === 'shortage' && proc.status === 'shortage') ||
      (selectedStatus === 'surplus' && proc.status === 'surplus');

    return matchesSearch && matchesLine && matchesStatus;
  });

  // Calculate totals for currently shown processes
  const totalStd = filteredProcesses.reduce((acc, p) => acc + p.std, 0);
  const totalAct = filteredProcesses.reduce((acc, p) => acc + p.act, 0);
  const totalReq = filteredProcesses.reduce((acc, p) => acc + p.mpReq, 0);
  const totalGap = totalAct - totalReq;

  // Check if any process has overrides
  const hasAnyOverrides = processes.some(
    (p) =>
      p.customTaktTime !== undefined ||
      p.customMpReq !== undefined ||
      p.customGap !== undefined ||
      p.customStatus !== undefined
  );

  // Stepper handlers
  const handleStepChange = (
    id: string,
    field: 'uph' | 'std' | 'act',
    delta: number,
    currentVal: number
  ) => {
    const minVal = field === 'uph' ? 1 : 0;
    const newVal = Math.max(minVal, currentVal + delta);
    onUpdateProcess(id, { [field]: newVal });
  };

  const handleDirectNumberInput = (
    id: string,
    field: 'uph' | 'std' | 'act',
    val: string
  ) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      onUpdateProcess(id, { [field]: field === 'uph' ? 1 : 0 });
    } else {
      const minVal = field === 'uph' ? 1 : 0;
      onUpdateProcess(id, { [field]: Math.max(minVal, parsed) });
    }
  };

  // Takt Time manual override handler
  const handleTaktChange = (proc: CalculatedProcess, val: string) => {
    if (val === '' || isNaN(parseFloat(val))) {
      // remove override, return to line default
      onUpdateProcess(proc.id, { customTaktTime: undefined });
    } else {
      onUpdateProcess(proc.id, { customTaktTime: Math.max(0.1, parseFloat(val)) });
    }
  };

  const handleTaktStep = (proc: CalculatedProcess, delta: number) => {
    const base = proc.taktTimeUsed || taktTime || 1;
    const newVal = Math.max(0.5, parseFloat((base + delta).toFixed(1)));
    onUpdateProcess(proc.id, { customTaktTime: newVal });
  };

  // MP Req manual override handler
  const handleMpReqChange = (proc: CalculatedProcess, val: string) => {
    if (val === '' || isNaN(parseFloat(val))) {
      onUpdateProcess(proc.id, { customMpReq: undefined });
    } else {
      onUpdateProcess(proc.id, { customMpReq: Math.max(0, parseFloat(val)) });
    }
  };

  const handleMpReqStep = (proc: CalculatedProcess, delta: number) => {
    const base = proc.mpReq || 0;
    const newVal = Math.max(0, parseFloat((base + delta).toFixed(1)));
    onUpdateProcess(proc.id, { customMpReq: newVal });
  };

  // Gap manual override handler
  const handleGapChange = (proc: CalculatedProcess, val: string) => {
    if (val === '' || isNaN(parseFloat(val))) {
      onUpdateProcess(proc.id, { customGap: undefined });
    } else {
      onUpdateProcess(proc.id, { customGap: parseFloat(val) });
    }
  };

  const handleGapStep = (proc: CalculatedProcess, delta: number) => {
    const base = proc.gap || 0;
    const newVal = parseFloat((base + delta).toFixed(1));
    onUpdateProcess(proc.id, { customGap: newVal });
  };

  // Status manual override handler
  const handleStatusChange = (proc: CalculatedProcess, val: string) => {
    if (val === 'auto') {
      onUpdateProcess(proc.id, { customStatus: undefined });
    } else {
      onUpdateProcess(proc.id, {
        customStatus: val as 'balanced' | 'shortage' | 'surplus',
      });
    }
  };

  // Reset row to formula
  const handleResetRowOverrides = (id: string) => {
    onUpdateProcess(id, {
      customTaktTime: undefined,
      customMpReq: undefined,
      customGap: undefined,
      customStatus: undefined,
    });
  };

  // Reset all rows in this line to formula
  const handleResetAllLineOverrides = () => {
    processes.forEach((p) => {
      if (
        p.customTaktTime !== undefined ||
        p.customMpReq !== undefined ||
        p.customGap !== undefined ||
        p.customStatus !== undefined
      ) {
        onUpdateProcess(p.id, {
          customTaktTime: undefined,
          customMpReq: undefined,
          customGap: undefined,
          customStatus: undefined,
        });
      }
    });
  };

  const startEditName = (proc: CalculatedProcess) => {
    setEditingNameId(proc.id);
    setEditingNameValue(proc.name);
  };

  const saveEditName = (id: string) => {
    if (editingNameValue.trim()) {
      onUpdateProcess(id, { name: editingNameValue.trim() });
    }
    setEditingNameId(null);
  };

  // Trigger manual save with tactile button feedback
  const handleTriggerSave = () => {
    if (onManualSave) {
      onManualSave();
    }
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false), 2000;
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
      {/* Table Card Header with Filters & Save Button */}
      <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-slate-200 text-base">
              รายละเอียดรายกระบวนการ — {lineTitle} (Process Breakdown)
            </h2>
            <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-mono">
              แก้ไขตัวเลขได้ทันที (Live Editable)
            </span>
            <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-mono">
              แก้ไข Takt, MP Req, Gap ได้
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            คลิกหรือพิมพ์แก้ไขค่า UPH, STD, Actual, Takt Time, MP Req, และ Gap ได้ตามต้องการ พร้อมปุ่มกดบันทึก
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหากระบวนการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Line Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
            <Filter className="w-3 h-3 text-slate-400 ml-1" />
            <span className="text-[11px] text-slate-400 px-1">Line:</span>
            {uniqueLines.slice(0, 5).map((line) => (
              <button
                key={line}
                type="button"
                onClick={() => setSelectedLine(line)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedLine === line
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {line}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">ทุกสถานะ</option>
            <option value="balanced">สมดุล (±1)</option>
            <option value="shortage">คนขาด (&lt; -1)</option>
            <option value="surplus">คนเกิน (&gt; +1)</option>
          </select>

          {/* Add Process Button */}
          <button
            id="add-process-btn"
            type="button"
            onClick={onAddNewProcess}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เพิ่มกระบวนการ</span>
          </button>

          {/* Reset All Overrides to Auto Formula if any exist */}
          {hasAnyOverrides && (
            <button
              type="button"
              onClick={handleResetAllLineOverrides}
              title="คืนค่าการคำนวณทั้งหมดในตารางนี้กลับเป็นสูตรอัตโนมัติ"
              className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg border border-amber-600/40 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>คืนค่าสูตร</span>
            </button>
          )}

          {/* Manual Save Button */}
          <button
            id="manual-save-table-btn"
            type="button"
            onClick={handleTriggerSave}
            title="กดบันทึกข้อมูลและค่าที่แก้ไขทั้งหมดลงระบบ"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow transition-all ${
              isSavedFeedback
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/50'
            }`}
          >
            {isSavedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 animate-bounce-short" />
                <span>บันทึกแล้ว!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกข้อมูล</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-400 border-b border-slate-700 text-xs">
            <tr>
              <th className="p-3 font-semibold min-w-[200px]">Process (กระบวนการ)</th>
              <th className="p-3 font-semibold">Line</th>
              <th className="p-3 font-semibold min-w-[110px]">
                <div className="flex items-center gap-1">
                  <span>UPH</span>
                  <span className="text-[10px] text-blue-400 font-normal">(แก้ได้)</span>
                </div>
              </th>
              <th className="p-3 font-semibold min-w-[105px]">
                <div className="flex items-center gap-1">
                  <span>MP STD</span>
                  <span className="text-[10px] text-purple-400 font-normal">(แก้ได้)</span>
                </div>
              </th>
              <th className="p-3 font-semibold min-w-[105px]">
                <div className="flex items-center gap-1">
                  <span>MP Actual</span>
                  <span className="text-[10px] text-emerald-400 font-normal">(แก้ได้)</span>
                </div>
              </th>
              <th className="p-3 font-semibold min-w-[110px]">
                <div className="flex items-center gap-1">
                  <span>Takt (s)</span>
                  <span className="text-[10px] text-amber-400 font-normal">(แก้ได้)</span>
                </div>
              </th>
              <th className="p-3 font-semibold min-w-[110px]">
                <div className="flex items-center gap-1">
                  <span>MP Req</span>
                  <span className="text-[10px] text-blue-400 font-normal">(แก้ได้)</span>
                </div>
              </th>
              <th className="p-3 font-semibold min-w-[105px]">
                <div className="flex items-center gap-1">
                  <span>Gap</span>
                  <span className="text-[10px] text-emerald-400 font-normal">(แก้ได้)</span>
                </div>
              </th>
              <th className="p-3 font-semibold min-w-[110px]">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="processTableBody" className="divide-y divide-slate-800">
            {filteredProcesses.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 text-sm">
                  ไม่พบข้อมูลกระบวนการที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              filteredProcesses.map((proc) => {
                const isRowOverridden =
                  proc.isTaktOverridden ||
                  proc.isMpReqOverridden ||
                  proc.isGapOverridden ||
                  proc.isStatusOverridden;

                return (
                  <tr
                    key={proc.id}
                    className={`hover:bg-slate-800/60 transition-colors group ${
                      isRowOverridden ? 'bg-slate-850/40' : ''
                    }`}
                  >
                    {/* Process Name (Editable on click) */}
                    <td className="p-3 font-medium text-slate-200">
                      {editingNameId === proc.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            onBlur={() => saveEditName(proc.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditName(proc.id);
                              if (e.key === 'Escape') setEditingNameId(null);
                            }}
                            className="bg-slate-900 border border-blue-500 rounded px-2 py-1 text-xs text-white w-full"
                          />
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer group/title flex items-start justify-between"
                          onClick={() => startEditName(proc)}
                          title="คลิกเพื่อแก้ไขชื่อกระบวนการ"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="group-hover/title:text-blue-300 transition-colors">
                                {proc.name}
                              </span>
                              <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                              {proc.isBottleneck && (
                                <span
                                  title="Cycle Time สูงกว่า Takt Time (Bottleneck)"
                                  className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded"
                                >
                                  CT {proc.cycleTime.toFixed(1)}s &gt; TT
                                </span>
                              )}
                              {isRowOverridden && (
                                <span
                                  title="แถวนี้มีการปรับแต่งค่าเอง (Manual Override)"
                                  className="px-1 py-0.2 text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded"
                                >
                                  ปรับเอง
                                </span>
                              )}
                            </div>
                            {proc.notes && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{proc.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Line */}
                    <td className="p-3 text-slate-400">
                      <select
                        value={proc.line}
                        onChange={(e) => onUpdateProcess(proc.id, { line: e.target.value })}
                        className="bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                      >
                        <option value="All">All</option>
                        <option value="L1">L1</option>
                        <option value="L2">L2</option>
                        <option value="Main">Main</option>
                        <option value="QA">QA</option>
                      </select>
                    </td>

                    {/* UPH (Live Editable Number + Stepper) */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-blue-500/80 rounded-md px-1.5 py-1 w-28 focus-within:border-blue-500 transition-colors">
                        <button
                          type="button"
                          onClick={() => handleStepChange(proc.id, 'uph', -5, proc.uph)}
                          title="ลด UPH (-5)"
                          className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={proc.uph}
                          onChange={(e) => handleDirectNumberInput(proc.id, 'uph', e.target.value)}
                          className="w-full bg-transparent text-center text-white font-mono font-semibold text-xs focus:outline-none"
                          title="พิมพ์เพื่อเปลี่ยน UPH"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepChange(proc.id, 'uph', +5, proc.uph)}
                          title="เพิ่ม UPH (+5)"
                          className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* MP STD (Live Editable Number + Stepper) */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-purple-500/80 rounded-md px-1 py-1 w-24 focus-within:border-purple-500 transition-colors">
                        <button
                          type="button"
                          onClick={() => handleStepChange(proc.id, 'std', -1, proc.std)}
                          title="ลด MP STD (-1)"
                          className="text-slate-500 hover:text-purple-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={proc.std}
                          onChange={(e) => handleDirectNumberInput(proc.id, 'std', e.target.value)}
                          className="w-full bg-transparent text-center text-purple-300 font-mono font-bold text-xs focus:outline-none"
                          title="พิมพ์เพื่อเปลี่ยน MP STD"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepChange(proc.id, 'std', +1, proc.std)}
                          title="เพิ่ม MP STD (+1)"
                          className="text-slate-500 hover:text-purple-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* MP Actual (Live Editable Number + Stepper) */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-emerald-500/80 rounded-md px-1 py-1 w-24 focus-within:border-emerald-500 transition-colors">
                        <button
                          type="button"
                          onClick={() => handleStepChange(proc.id, 'act', -1, proc.act)}
                          title="ลด MP Actual (-1)"
                          className="text-slate-500 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={proc.act}
                          onChange={(e) => handleDirectNumberInput(proc.id, 'act', e.target.value)}
                          className="w-full bg-transparent text-center text-emerald-400 font-mono font-bold text-xs focus:outline-none"
                          title="พิมพ์เพื่อเปลี่ยน MP Actual"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepChange(proc.id, 'act', +1, proc.act)}
                          title="เพิ่ม MP Actual (+1)"
                          className="text-slate-500 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Takt Time (Live Editable Number + Stepper + Manual Override) */}
                    <td className="p-3">
                      <div
                        className={`flex items-center gap-1 bg-slate-900/90 border rounded-md px-1 py-1 w-28 transition-colors ${
                          proc.isTaktOverridden
                            ? 'border-amber-500/80 bg-amber-950/20'
                            : 'border-slate-700 hover:border-amber-500/60 focus-within:border-amber-500'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleTaktStep(proc, -0.5)}
                          title="ลด Takt Time (-0.5s)"
                          className="text-slate-500 hover:text-amber-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          value={
                            proc.customTaktTime !== undefined
                              ? proc.customTaktTime
                              : parseFloat(proc.taktTimeUsed.toFixed(1))
                          }
                          onChange={(e) => handleTaktChange(proc, e.target.value)}
                          className={`w-full bg-transparent text-center font-mono font-semibold text-xs focus:outline-none ${
                            proc.isTaktOverridden ? 'text-amber-300 font-bold' : 'text-slate-300'
                          }`}
                          title={
                            proc.isTaktOverridden
                              ? 'Takt Time ถูกกำหนดเอง (คลิกเพื่อแก้หรือเว้นว่างเพื่อคืนค่า)'
                              : 'พิมพ์เพื่อกำหนด Takt Time เฉพาะสถานีนี้'
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleTaktStep(proc, +0.5)}
                          title="เพิ่ม Takt Time (+0.5s)"
                          className="text-slate-500 hover:text-amber-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* MP Req (Live Editable Number + Stepper + Manual Override) */}
                    <td className="p-3">
                      <div
                        className={`flex items-center gap-1 bg-slate-900/90 border rounded-md px-1 py-1 w-26 transition-colors ${
                          proc.isMpReqOverridden
                            ? 'border-blue-500/80 bg-blue-950/20'
                            : 'border-slate-700 hover:border-blue-500/60 focus-within:border-blue-500'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleMpReqStep(proc, -0.1)}
                          title="ลด MP Req (-0.1)"
                          className="text-slate-500 hover:text-blue-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={
                            proc.customMpReq !== undefined
                              ? proc.customMpReq
                              : parseFloat(proc.mpReq.toFixed(1))
                          }
                          onChange={(e) => handleMpReqChange(proc, e.target.value)}
                          className={`w-full bg-transparent text-center font-mono font-bold text-xs focus:outline-none ${
                            proc.isMpReqOverridden ? 'text-blue-300' : 'text-blue-400'
                          }`}
                          title={
                            proc.isMpReqOverridden
                              ? 'MP Req ถูกกำหนดเอง (ลบออกเพื่อคืนค่าสูตรคำนวณ CT/TT)'
                              : 'พิมพ์เพื่อกำหนด MP Req เอง'
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleMpReqStep(proc, +0.1)}
                          title="เพิ่ม MP Req (+0.1)"
                          className="text-slate-500 hover:text-blue-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Gap (Live Editable Number + Stepper + Manual Override) */}
                    <td className="p-3">
                      <div
                        className={`flex items-center gap-1 bg-slate-900/90 border rounded-md px-1 py-1 w-26 transition-colors ${
                          proc.isGapOverridden
                            ? 'border-emerald-500/80 bg-emerald-950/20'
                            : 'border-slate-700 hover:border-emerald-500/60 focus-within:border-emerald-500'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleGapStep(proc, -0.5)}
                          title="ลด Gap (-0.5)"
                          className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          value={
                            proc.customGap !== undefined
                              ? proc.customGap
                              : parseFloat(proc.gap.toFixed(1))
                          }
                          onChange={(e) => handleGapChange(proc, e.target.value)}
                          className={`w-full bg-transparent text-center font-mono font-bold text-xs focus:outline-none ${
                            proc.gap > 1
                              ? 'text-amber-400'
                              : proc.gap < -1
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                          title={
                            proc.isGapOverridden
                              ? 'Gap ถูกกำหนดเอง (ลบออกเพื่อคืนค่าสูตร Act - Req)'
                              : 'พิมพ์เพื่อกำหนด Gap เอง'
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleGapStep(proc, +0.5)}
                          title="เพิ่ม Gap (+0.5)"
                          className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Status (Editable select) */}
                    <td className="p-3">
                      <select
                        value={proc.customStatus || 'auto'}
                        onChange={(e) => handleStatusChange(proc, e.target.value)}
                        className={`rounded px-2 py-1 text-xs font-medium border focus:outline-none transition-colors ${
                          proc.status === 'shortage'
                            ? 'bg-rose-950 text-rose-300 border-rose-700/80'
                            : proc.status === 'surplus'
                            ? 'bg-amber-950 text-amber-300 border-amber-700/80'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-700/80'
                        }`}
                        title="เลือกเปลี่ยนสถานะกระบวนการ หรือเลือก Auto ตามสูตร Gap"
                      >
                        <option value="auto">
                          {proc.status === 'shortage'
                            ? 'Auto: คนขาด'
                            : proc.status === 'surplus'
                            ? 'Auto: คนเกิน'
                            : 'Auto: สมดุล'}
                        </option>
                        <option value="balanced">✓ สมดุล</option>
                        <option value="shortage">⚠️ คนขาด</option>
                        <option value="surplus">⚡ คนเกิน</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isRowOverridden && (
                          <button
                            type="button"
                            onClick={() => handleResetRowOverrides(proc.id)}
                            title="คืนค่าแถวนี้กลับเป็นสูตรคำนวณอัตโนมัติ"
                            className="p-1 text-amber-400 hover:text-amber-200 hover:bg-slate-700/60 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteProcess(proc.id)}
                          title="ลบกระบวนการนี้"
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Summary Footer Row */}
          <tfoot className="bg-slate-900/90 text-slate-300 font-semibold border-t-2 border-slate-700 text-xs">
            <tr>
              <td className="p-3">
                รวมทั้งหมด ({filteredProcesses.length} กระบวนการ)
              </td>
              <td className="p-3 text-slate-400">-</td>
              <td className="p-3 text-slate-400">-</td>
              <td className="p-3 text-purple-300 font-mono text-sm">{totalStd}</td>
              <td className="p-3 text-emerald-400 font-mono text-sm">{totalAct}</td>
              <td className="p-3 text-slate-400 font-mono">{taktTime.toFixed(1)}</td>
              <td className="p-3 text-blue-400 font-mono text-sm">{totalReq.toFixed(1)}</td>
              <td className="p-3 font-mono">
                <span
                  className={
                    totalGap > 1
                      ? 'text-amber-400'
                      : totalGap < -1
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }
                >
                  {totalGap > 0 ? `+${totalGap.toFixed(1)}` : totalGap.toFixed(1)}
                </span>
              </td>
              <td colSpan={2} className="p-3 text-slate-400 font-normal">
                {totalGap < -1
                  ? '⚠️ กำลังคนขาดแคลนรวม'
                  : totalGap > 1
                  ? '⚡ กำลังคนเกินเป้าหมาย'
                  : '✓ กำลังคนสมดุล'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
