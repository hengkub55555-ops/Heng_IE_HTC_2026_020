import React, { useState, useMemo } from 'react';
import {
  PlantSummaryKpi,
  CalculatedProcess,
  ProcessItem,
  ProductionParams,
} from '../types';
import { ExecutiveBriefing } from './ExecutiveBriefing';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  UserCheck,
  ShieldAlert,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Gauge,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Minus,
  Plus,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';

interface SummaryDashboardProps {
  plantKpi: PlantSummaryKpi;
  lineACalculated: CalculatedProcess[];
  lineBCalculated: CalculatedProcess[];
  lineAParams: ProductionParams;
  lineBParams: ProductionParams;
  onNavigateToLine: (lineId: 'lineA' | 'lineB') => void;
  onUpdateProcessLineA: (id: string, updates: Partial<ProcessItem>) => void;
  onUpdateProcessLineB: (id: string, updates: Partial<ProcessItem>) => void;
  onManualSave?: () => void;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  plantKpi,
  lineACalculated,
  lineBCalculated,
  lineAParams,
  lineBParams,
  onNavigateToLine,
  onUpdateProcessLineA,
  onUpdateProcessLineB,
  onManualSave,
}) => {
  const [tableFilterLine, setTableFilterLine] = useState<'All' | 'lineA' | 'lineB'>('All');
  const [tableFilterStatus, setTableFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // What-if simulation state
  const [simPlanPercent, setSimPlanPercent] = useState<number>(0); // e.g. +10%, -10%
  const [simEffBoost, setSimEffBoost] = useState<number>(0); // e.g. +0.05

  // Combined master processes with line identifier
  const combinedProcesses = useMemo(() => {
    const listA = lineACalculated.map((p) => ({
      ...p,
      sourceLine: 'lineA' as const,
      lineLabel: 'Line A (Refrig A)',
    }));
    const listB = lineBCalculated.map((p) => ({
      ...p,
      sourceLine: 'lineB' as const,
      lineLabel: 'Line B (Refrig B)',
    }));
    return [...listA, ...listB];
  }, [lineACalculated, lineBCalculated]);

  // Filtered master processes
  const filteredProcesses = useMemo(() => {
    return combinedProcesses.filter((proc) => {
      const matchLine =
        tableFilterLine === 'All' || proc.sourceLine === tableFilterLine;
      const matchStatus =
        tableFilterStatus === 'All' || proc.status === tableFilterStatus;
      const matchSearch =
        proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc.line.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proc.category && proc.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        proc.lineLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLine && matchStatus && matchSearch;
    });
  }, [combinedProcesses, tableFilterLine, tableFilterStatus, searchQuery]);

  // What-if simulated calculations
  const simulationResults = useMemo(() => {
    const factor = 1 + simPlanPercent / 100;
    const simPlanA = Math.round(lineAParams.dailyPlan * factor);
    const simPlanB = Math.round(lineBParams.dailyPlan * factor);
    const simEffA = Math.min(1.0, Math.max(0.5, lineAParams.efficiency + simEffBoost));
    const simEffB = Math.min(1.0, Math.max(0.5, lineBParams.efficiency + simEffBoost));

    // Simulated Takt Times
    const shiftPlanA = simPlanA / lineAParams.shifts;
    const shiftPlanB = simPlanB / lineBParams.shifts;
    const simTaktA = shiftPlanA > 0 ? (lineAParams.workTime * simEffA) / shiftPlanA : 0;
    const simTaktB = shiftPlanB > 0 ? (lineBParams.workTime * simEffB) / shiftPlanB : 0;

    let simReqA = 0;
    lineACalculated.forEach((p) => {
      if (simTaktA > 0) simReqA += p.cycleTime / simTaktA;
    });

    let simReqB = 0;
    lineBCalculated.forEach((p) => {
      if (simTaktB > 0) simReqB += p.cycleTime / simTaktB;
    });

    const totalSimReq = simReqA + simReqB;
    const diffFromCurrent = totalSimReq - plantKpi.totalMpReq;

    return {
      simPlanA,
      simPlanB,
      totalSimPlan: simPlanA + simPlanB,
      simReqA,
      simReqB,
      totalSimReq,
      diffFromCurrent,
      simTaktA,
      simTaktB,
    };
  }, [
    simPlanPercent,
    simEffBoost,
    lineAParams,
    lineBParams,
    lineACalculated,
    lineBCalculated,
    plantKpi.totalMpReq,
  ]);

  // Chart data: Line A vs Line B vs Plant Total
  const comparisonBarData = [
    {
      name: 'Line A (ตู้เย็น A)',
      std: plantKpi.lineAKpi.totalMpStd,
      act: plantKpi.lineAKpi.totalMpAct,
      req: parseFloat(plantKpi.lineAKpi.totalMpReq.toFixed(1)),
    },
    {
      name: 'Line B (ตู้เย็น B)',
      std: plantKpi.lineBKpi.totalMpStd,
      act: plantKpi.lineBKpi.totalMpAct,
      req: parseFloat(plantKpi.lineBKpi.totalMpReq.toFixed(1)),
    },
    {
      name: 'ทั้งโรงงาน (A+B)',
      std: plantKpi.totalMpStd,
      act: plantKpi.totalMpAct,
      req: parseFloat(plantKpi.totalMpReq.toFixed(1)),
    },
  ];

  // Headcount by category
  const categoryData = useMemo(() => {
    const cats: Record<string, { name: string; lineA: number; lineB: number }> = {};
    combinedProcesses.forEach((p) => {
      const cat = p.category || 'General';
      if (!cats[cat]) {
        cats[cat] = { name: cat, lineA: 0, lineB: 0 };
      }
      if (p.sourceLine === 'lineA') {
        cats[cat].lineA += p.act;
      } else {
        cats[cat].lineB += p.act;
      }
    });
    return Object.values(cats);
  }, [combinedProcesses]);

  // Handlers for direct number editing in master table
  const handleMasterNumberInput = (
    proc: (typeof combinedProcesses)[0],
    field: 'uph' | 'std' | 'act',
    val: string
  ) => {
    const parsed = parseFloat(val);
    const minVal = field === 'uph' ? 1 : 0;
    const finalVal = isNaN(parsed) ? minVal : Math.max(minVal, parsed);
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { [field]: finalVal });
    } else {
      onUpdateProcessLineB(proc.id, { [field]: finalVal });
    }
  };

  const [isMasterSavedFeedback, setIsMasterSavedFeedback] = useState(false);

  const handleMasterStep = (
    proc: (typeof combinedProcesses)[0],
    field: 'uph' | 'std' | 'act',
    delta: number,
    currentVal: number
  ) => {
    const minVal = field === 'uph' ? 1 : 0;
    const finalVal = Math.max(minVal, currentVal + delta);
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { [field]: finalVal });
    } else {
      onUpdateProcessLineB(proc.id, { [field]: finalVal });
    }
  };

  const handleMasterTaktChange = (proc: (typeof combinedProcesses)[0], val: string) => {
    const newVal = val === '' || isNaN(parseFloat(val)) ? undefined : Math.max(0.1, parseFloat(val));
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customTaktTime: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customTaktTime: newVal });
    }
  };

  const handleMasterTaktStep = (proc: (typeof combinedProcesses)[0], delta: number) => {
    const base = proc.taktTimeUsed || 1;
    const newVal = Math.max(0.5, parseFloat((base + delta).toFixed(1)));
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customTaktTime: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customTaktTime: newVal });
    }
  };

  const handleMasterMpReqChange = (proc: (typeof combinedProcesses)[0], val: string) => {
    const newVal = val === '' || isNaN(parseFloat(val)) ? undefined : Math.max(0, parseFloat(val));
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customMpReq: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customMpReq: newVal });
    }
  };

  const handleMasterMpReqStep = (proc: (typeof combinedProcesses)[0], delta: number) => {
    const base = proc.mpReq || 0;
    const newVal = Math.max(0, parseFloat((base + delta).toFixed(1)));
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customMpReq: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customMpReq: newVal });
    }
  };

  const handleMasterGapChange = (proc: (typeof combinedProcesses)[0], val: string) => {
    const newVal = val === '' || isNaN(parseFloat(val)) ? undefined : parseFloat(val);
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customGap: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customGap: newVal });
    }
  };

  const handleMasterGapStep = (proc: (typeof combinedProcesses)[0], delta: number) => {
    const base = proc.gap || 0;
    const newVal = parseFloat((base + delta).toFixed(1));
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customGap: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customGap: newVal });
    }
  };

  const handleMasterStatusChange = (proc: (typeof combinedProcesses)[0], val: string) => {
    const newVal = val === 'auto' ? undefined : (val as 'balanced' | 'shortage' | 'surplus');
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, { customStatus: newVal });
    } else {
      onUpdateProcessLineB(proc.id, { customStatus: newVal });
    }
  };

  const handleResetMasterRow = (proc: (typeof combinedProcesses)[0]) => {
    const updates = {
      customTaktTime: undefined,
      customMpReq: undefined,
      customGap: undefined,
      customStatus: undefined,
    };
    if (proc.sourceLine === 'lineA') {
      onUpdateProcessLineA(proc.id, updates);
    } else {
      onUpdateProcessLineB(proc.id, updates);
    }
  };

  const handleTriggerMasterSave = () => {
    if (onManualSave) {
      onManualSave();
    }
    setIsMasterSavedFeedback(true);
    setTimeout(() => setIsMasterSavedFeedback(false), 2000);
  };

  const isPlantShortage = plantKpi.totalGap < -1;
  const isPlantSurplus = plantKpi.totalGap > 1;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Sheet Summary Dashboard — ภาพรวมกำลังคนทั้งโรงงาน (Line A + Line B)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            สรุปข้อมูลเปรียบเทียบระหว่างสายการผลิต Line A และ Line B, วิเคราะห์ความต้องการกำลังคนรวม, และจำลองผลกระทบต่อแผนการผลิต
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToLine('lineA')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-blue-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <span>เปิด Sheet Line A</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateToLine('lineB')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <span>เปิด Sheet Line B</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Executive Briefing for Plant Manager (ข้อสรุปสำหรับผู้จัดการโรงงาน) */}
      <ExecutiveBriefing
        plantKpi={plantKpi}
        lineACalculated={lineACalculated}
        lineBCalculated={lineBCalculated}
        lineAParams={lineAParams}
        lineBParams={lineBParams}
      />

      {/* 1. Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Production Plan */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 border-amber-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Daily Plan รวมโรงงาน (ชิ้น/วัน)
            </span>
            <Gauge className="w-4 h-4 text-amber-400/80" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-1 font-mono">
            {plantKpi.totalDailyPlan.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>
              Line A: <strong>{lineAParams.dailyPlan.toLocaleString()}</strong> | Line B:{' '}
              <strong>{lineBParams.dailyPlan.toLocaleString()}</strong>
            </span>
            <span className="text-slate-300 font-mono">
              ≈ {Math.round(plantKpi.totalPlanPerShift).toLocaleString()} /กะ
            </span>
          </div>
        </div>

        {/* Total MP Required */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Total MP Required (คนต้องการรวม)
            </span>
            <Users className="w-4 h-4 text-blue-400/80" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mt-1 font-mono">
            {plantKpi.totalMpReq.toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>
              Line A: {plantKpi.lineAKpi.totalMpReq.toFixed(1)} | Line B:{' '}
              {plantKpi.lineBKpi.totalMpReq.toFixed(1)}
            </span>
            <span className="text-slate-300 font-semibold">
              ≈ {Math.ceil(plantKpi.totalMpReq)} คน
            </span>
          </div>
        </div>

        {/* Total MP Actual */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 border-emerald-500 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Total MP Actual (คนจริงทั้งโรงงาน)
            </span>
            <UserCheck className="w-4 h-4 text-emerald-400/80" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-1 font-mono">
            {plantKpi.totalMpAct}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>
              Line A: {plantKpi.lineAKpi.totalMpAct} คน | Line B:{' '}
              {plantKpi.lineBKpi.totalMpAct} คน
            </span>
            <span className="text-emerald-400 font-medium">STD รวม: {plantKpi.totalMpStd}</span>
          </div>
        </div>

        {/* Total Plant Gap */}
        <div
          className={`bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 ${
            isPlantShortage
              ? 'border-rose-500'
              : isPlantSurplus
              ? 'border-amber-500'
              : 'border-emerald-500'
          } shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Plant Gap (Act − Req)
            </span>
            <ArrowUpDown
              className={`w-4 h-4 ${
                isPlantShortage
                  ? 'text-rose-400'
                  : isPlantSurplus
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            />
          </div>
          <div
            className={`text-3xl font-bold mt-1 font-mono ${
              isPlantShortage
                ? 'text-rose-400'
                : isPlantSurplus
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {plantKpi.totalGap > 0 ? `+${plantKpi.totalGap.toFixed(1)}` : plantKpi.totalGap.toFixed(1)}
          </div>
          <div className="text-[11px] mt-2 flex items-center justify-between">
            <span className="text-slate-400">สถานะรวม 2 สาย</span>
            {isPlantShortage ? (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                <TrendingDown className="w-3 h-3" /> ขาดแคลน {Math.abs(plantKpi.totalGap).toFixed(1)} คน
              </span>
            ) : isPlantSurplus ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                <TrendingUp className="w-3 h-3" /> เกิน {plantKpi.totalGap.toFixed(1)} คน
              </span>
            ) : (
              <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                ✓ สมดุลกำลังคน
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Matrix Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              ตารางเปรียบเทียบมาตรฐานสายการผลิต (Line Comparison Matrix)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              เปรียบเทียบพารามิเตอร์การผลิต จังหวะเวลา (Takt Time) และกำลังคนระหว่าง Line A กับ Line B
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              สถานีคอขวด (Bottlenecks):{' '}
              <strong className="text-amber-400 font-mono">
                {plantKpi.totalBottlenecks} จุด
              </strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 text-xs">
              <tr>
                <th className="p-3 font-semibold">สายการผลิต (Line)</th>
                <th className="p-3 font-semibold">ยอดผลิตต่อวัน (Plan)</th>
                <th className="p-3 font-semibold">Shifts</th>
                <th className="p-3 font-semibold">Eff %</th>
                <th className="p-3 font-semibold">Takt Time</th>
                <th className="p-3 font-semibold">Line Speed</th>
                <th className="p-3 font-semibold">MP STD</th>
                <th className="p-3 font-semibold">MP Actual</th>
                <th className="p-3 font-semibold">MP Req</th>
                <th className="p-3 font-semibold">Gap</th>
                <th className="p-3 font-semibold">Balancing Rate</th>
                <th className="p-3 font-semibold text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {/* Line A Row */}
              <tr className="hover:bg-slate-800/60 transition-colors">
                <td className="p-3 font-semibold text-blue-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <div>
                    <span>Line A (ตู้เย็น A)</span>
                    <span className="block text-[11px] text-slate-500 font-normal">
                      310 STD / 312 Act
                    </span>
                  </div>
                </td>
                <td className="p-3 font-mono font-medium text-slate-200">
                  {lineAParams.dailyPlan.toLocaleString()} ชิ้น
                </td>
                <td className="p-3 text-slate-300">{lineAParams.shifts} กะ</td>
                <td className="p-3 text-emerald-400 font-semibold">
                  {Math.round(lineAParams.efficiency * 100)}%
                </td>
                <td className="p-3 font-mono font-bold text-blue-400">
                  {plantKpi.lineAKpi.taktTime.toFixed(2)}s
                </td>
                <td className="p-3 font-mono text-slate-300">
                  {plantKpi.lineAKpi.taktTime > 0
                    ? (3600 / plantKpi.lineAKpi.taktTime).toFixed(1)
                    : '0'}{' '}
                  ชิ้น/ชม.
                </td>
                <td className="p-3 font-mono text-purple-300 font-bold">
                  {plantKpi.lineAKpi.totalMpStd}
                </td>
                <td className="p-3 font-mono text-emerald-400 font-bold">
                  {plantKpi.lineAKpi.totalMpAct}
                </td>
                <td className="p-3 font-mono text-blue-400 font-bold">
                  {plantKpi.lineAKpi.totalMpReq.toFixed(1)}
                </td>
                <td className="p-3 font-mono">
                  <span
                    className={
                      plantKpi.lineAKpi.totalGap > 1
                        ? 'text-amber-400 font-semibold'
                        : plantKpi.lineAKpi.totalGap < -1
                        ? 'text-rose-400 font-semibold'
                        : 'text-emerald-400 font-semibold'
                    }
                  >
                    {plantKpi.lineAKpi.totalGap > 0
                      ? `+${plantKpi.lineAKpi.totalGap.toFixed(1)}`
                      : plantKpi.lineAKpi.totalGap.toFixed(1)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-200">
                      {plantKpi.lineAKpi.balancingRate}%
                    </span>
                    <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${Math.min(100, plantKpi.lineAKpi.balancingRate)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => onNavigateToLine('lineA')}
                    className="px-2.5 py-1 text-xs bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded transition-colors"
                  >
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>

              {/* Line B Row */}
              <tr className="hover:bg-slate-800/60 transition-colors">
                <td className="p-3 font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <div>
                    <span>Line B (ตู้เย็น B)</span>
                    <span className="block text-[11px] text-slate-500 font-normal">
                      252 STD / 255 Act
                    </span>
                  </div>
                </td>
                <td className="p-3 font-mono font-medium text-slate-200">
                  {lineBParams.dailyPlan.toLocaleString()} ชิ้น
                </td>
                <td className="p-3 text-slate-300">{lineBParams.shifts} กะ</td>
                <td className="p-3 text-emerald-400 font-semibold">
                  {Math.round(lineBParams.efficiency * 100)}%
                </td>
                <td className="p-3 font-mono font-bold text-emerald-400">
                  {plantKpi.lineBKpi.taktTime.toFixed(2)}s
                </td>
                <td className="p-3 font-mono text-slate-300">
                  {plantKpi.lineBKpi.taktTime > 0
                    ? (3600 / plantKpi.lineBKpi.taktTime).toFixed(1)
                    : '0'}{' '}
                  ชิ้น/ชม.
                </td>
                <td className="p-3 font-mono text-purple-300 font-bold">
                  {plantKpi.lineBKpi.totalMpStd}
                </td>
                <td className="p-3 font-mono text-emerald-400 font-bold">
                  {plantKpi.lineBKpi.totalMpAct}
                </td>
                <td className="p-3 font-mono text-blue-400 font-bold">
                  {plantKpi.lineBKpi.totalMpReq.toFixed(1)}
                </td>
                <td className="p-3 font-mono">
                  <span
                    className={
                      plantKpi.lineBKpi.totalGap > 1
                        ? 'text-amber-400 font-semibold'
                        : plantKpi.lineBKpi.totalGap < -1
                        ? 'text-rose-400 font-semibold'
                        : 'text-emerald-400 font-semibold'
                    }
                  >
                    {plantKpi.lineBKpi.totalGap > 0
                      ? `+${plantKpi.lineBKpi.totalGap.toFixed(1)}`
                      : plantKpi.lineBKpi.totalGap.toFixed(1)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-200">
                      {plantKpi.lineBKpi.balancingRate}%
                    </span>
                    <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(100, plantKpi.lineBKpi.balancingRate)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => onNavigateToLine('lineB')}
                    className="px-2.5 py-1 text-xs bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded transition-colors"
                  >
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            </tbody>

            {/* Total Footer Row */}
            <tfoot className="bg-slate-900 text-slate-200 font-semibold border-t-2 border-slate-700 text-xs sm:text-sm">
              <tr>
                <td className="p-3">รวมทั้งโรงงาน (Line A + Line B)</td>
                <td className="p-3 font-mono text-amber-400">
                  {plantKpi.totalDailyPlan.toLocaleString()} ชิ้น
                </td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 font-mono text-purple-300 font-bold">
                  {plantKpi.totalMpStd}
                </td>
                <td className="p-3 font-mono text-emerald-400 font-bold">
                  {plantKpi.totalMpAct}
                </td>
                <td className="p-3 font-mono text-blue-400 font-bold">
                  {plantKpi.totalMpReq.toFixed(1)}
                </td>
                <td className="p-3 font-mono">
                  <span
                    className={
                      plantKpi.totalGap > 1
                        ? 'text-amber-400 font-bold'
                        : plantKpi.totalGap < -1
                        ? 'text-rose-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    {plantKpi.totalGap > 0
                      ? `+${plantKpi.totalGap.toFixed(1)}`
                      : plantKpi.totalGap.toFixed(1)}
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-200">
                  เฉลี่ย {plantKpi.avgBalancingRate}%
                </td>
                <td className="p-3 text-right text-slate-400 font-normal text-xs">
                  {plantKpi.totalGap < -1
                    ? '⚠️ ขาดแคลน'
                    : plantKpi.totalGap > 1
                    ? '⚡ มีคนเกิน'
                    : '✓ สมดุล'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. Visual Charts (Multi-line Comparison & Category Headcount) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Headcount comparison */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
            <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">
              เปรียบเทียบกำลังคน (Line A vs Line B vs โรงงานรวม)
            </h4>
            <span className="text-[11px] text-slate-400">STD vs ACT vs REQ</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarData}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">{label}</p>
                          <p className="text-purple-400">
                            MP STD: <strong className="text-white">{payload[0].value}</strong> คน
                          </p>
                          <p className="text-emerald-400">
                            MP Actual: <strong className="text-white">{payload[1].value}</strong> คน
                          </p>
                          <p className="text-blue-400">
                            MP Required: <strong className="text-white">{payload[2].value}</strong> คน
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                />
                <Bar dataKey="std" name="MP STD (คน)" fill="#a855f7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="act" name="MP Actual (คน)" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="req" name="MP Required (คน)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount by Category */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
            <h4 className="font-semibold text-slate-200 text-xs sm:text-sm">
              สัดส่วนกำลังคนตามแผนก/หมวดหมู่งาน (Actual Headcount by Category)
            </h4>
            <span className="text-[11px] text-slate-400">คนจริง Line A vs Line B</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const a = Number(payload[0].value) || 0;
                      const b = Number(payload[1].value) || 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-200">{label}</p>
                          <p className="text-blue-400">Line A: {a} คน</p>
                          <p className="text-emerald-400">Line B: {b} คน</p>
                          <p className="text-amber-400 border-t border-slate-800 pt-1 font-semibold">
                            รวมหมวดหมู่นี้: {a + b} คน
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }}
                />
                <Bar dataKey="lineA" name="Line A (คนจริง)" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="lineB" name="Line B (คนจริง)" fill="#10b981" stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Plant What-If Scenario Simulator */}
      <div className="bg-slate-900 border border-blue-900/50 rounded-xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-sm">
              เครื่องมือจำลองสถานการณ์กำลังคนทั้งโรงงาน (Plant What-If Scenario Simulator)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            ทดลองปรับยอดผลิตหรือ Eff รวม เพื่อดูผลกระทบต่อกำลังคนทันที
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
          {/* Sliders */}
          <div className="space-y-4 md:col-span-1">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>ปรับยอดแผนผลิต (Plan Delta):</span>
                <strong className={simPlanPercent > 0 ? 'text-amber-400' : simPlanPercent < 0 ? 'text-blue-400' : 'text-slate-400'}>
                  {simPlanPercent > 0 ? `+${simPlanPercent}%` : `${simPlanPercent}%`}
                </strong>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="5"
                value={simPlanPercent}
                onChange={(e) => setSimPlanPercent(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>-30%</span>
                <span>0% (ปัจจุบัน)</span>
                <span>+50%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>ปรับเพิ่ม/ลด Efficiency รวม:</span>
                <strong className={simEffBoost > 0 ? 'text-emerald-400' : simEffBoost < 0 ? 'text-rose-400' : 'text-slate-400'}>
                  {simEffBoost > 0 ? `+${Math.round(simEffBoost * 100)}%` : `${Math.round(simEffBoost * 100)}%`}
                </strong>
              </div>
              <input
                type="range"
                min="-0.15"
                max="0.15"
                step="0.05"
                value={simEffBoost}
                onChange={(e) => setSimEffBoost(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>-15%</span>
                <span>0%</span>
                <span>+15%</span>
              </div>
            </div>

            {(simPlanPercent !== 0 || simEffBoost !== 0) && (
              <button
                type="button"
                onClick={() => {
                  setSimPlanPercent(0);
                  setSimEffBoost(0);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                รีเซ็ตการจำลองกลับเป็นค่าปัจจุบัน
              </button>
            )}
          </div>

          {/* Results display */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg">
              <span className="text-[11px] text-slate-400 block">ยอดผลิตจำลองรวม</span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {simulationResults.totalSimPlan.toLocaleString()} ชิ้น/วัน
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Line A: {simulationResults.simPlanA.toLocaleString()} | Line B: {simulationResults.simPlanB.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg">
              <span className="text-[11px] text-slate-400 block">MP Required จำลอง</span>
              <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                {simulationResults.totalSimReq.toFixed(1)} คน
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Line A: {simulationResults.simReqA.toFixed(1)} | Line B: {simulationResults.simReqB.toFixed(1)}
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg">
              <span className="text-[11px] text-slate-400 block">กำลังคนที่ต้องเพิ่ม/ลด</span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  simulationResults.diffFromCurrent > 0.5
                    ? 'text-rose-400'
                    : simulationResults.diffFromCurrent < -0.5
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {simulationResults.diffFromCurrent > 0
                  ? `+${simulationResults.diffFromCurrent.toFixed(1)} คน`
                  : `${simulationResults.diffFromCurrent.toFixed(1)} คน`}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {simulationResults.diffFromCurrent > 0.5
                  ? 'ต้องเสริมกำลังคนเพิ่มขึ้น'
                  : simulationResults.diffFromCurrent < -0.5
                  ? 'ลดความต้องการกำลังคนลง'
                  : 'กำลังคนใกล้เคียงเดิม'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Master Consolidated Process Breakdown Table (Live Editable) */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-200 text-base">
                ตารางรวมกระบวนการทั้งหมดในโรงงาน (Master Plant Process Breakdown)
              </h3>
              <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-mono">
                แก้ไขตัวเลขได้ทันที (Live Editable)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดงรายการทุกสถานีผลิตของ Line A และ Line B รวมกัน สามารถแก้ไข UPH, STD, Actual ได้จากหน้านี้ ข้อมูลจะซิงค์และบันทึกอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหากระบวนการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-52"
              />
            </div>

            {/* Line Filter */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              <span className="text-[11px] text-slate-400 px-1">สาย:</span>
              {(['All', 'lineA', 'lineB'] as const).map((lineKey) => (
                <button
                  key={lineKey}
                  type="button"
                  onClick={() => setTableFilterLine(lineKey)}
                  className={`px-2.5 py-0.5 rounded transition-colors ${
                    tableFilterLine === lineKey
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lineKey === 'All' ? 'ทั้งหมด' : lineKey === 'lineA' ? 'Line A' : 'Line B'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={tableFilterStatus}
              onChange={(e) => setTableFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="All">ทุกสถานะ</option>
              <option value="balanced">สมดุล (±1)</option>
              <option value="shortage">คนขาด (&lt; -1)</option>
              <option value="surplus">คนเกิน (&gt; +1)</option>
            </select>

            {/* Manual Save Button for Master Table */}
            <button
              type="button"
              onClick={handleTriggerMasterSave}
              title="กดบันทึกข้อมูลและค่าที่แก้ไขทั้งหมดลงระบบ"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow transition-all ${
                isMasterSavedFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-900/50'
              }`}
            >
              {isMasterSavedFeedback ? (
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

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-400 border-b border-slate-700 text-xs">
              <tr>
                <th className="p-3 font-semibold min-w-[220px]">Process (กระบวนการ)</th>
                <th className="p-3 font-semibold">สาย / สถานี</th>
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
            <tbody className="divide-y divide-slate-800">
              {filteredProcesses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 text-sm">
                    ไม่พบกระบวนการที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredProcesses.map((proc) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 bg-emerald-900 text-emerald-300 rounded text-xs border border-emerald-700/60 inline-flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> สมดุล
                    </span>
                  );
                  if (proc.status === 'shortage') {
                    statusBadge = (
                      <span className="px-2 py-0.5 bg-rose-900 text-rose-300 rounded text-xs border border-rose-700/60 inline-flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" /> คนขาด
                      </span>
                    );
                  } else if (proc.status === 'surplus') {
                    statusBadge = (
                      <span className="px-2 py-0.5 bg-amber-900 text-amber-300 rounded text-xs border border-amber-700/60 inline-flex items-center gap-1 font-medium">
                        คนเกิน
                      </span>
                    );
                  }

                  const taktForThisLine =
                    proc.sourceLine === 'lineA'
                      ? plantKpi.lineAKpi.taktTime
                      : plantKpi.lineBKpi.taktTime;

                  return (
                    <tr
                      key={proc.id}
                      className="hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="p-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              proc.sourceLine === 'lineA' ? 'bg-blue-400' : 'bg-emerald-400'
                            }`}
                          ></span>
                          <span>{proc.name}</span>
                          {proc.isBottleneck && (
                            <span
                              title="Bottleneck: CT สูงกว่า Takt Time"
                              className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded"
                            >
                              CT {proc.cycleTime.toFixed(1)}s &gt; TT
                            </span>
                          )}
                        </div>
                        {proc.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 pl-4">{proc.notes}</p>
                        )}
                      </td>

                      <td className="p-3 text-slate-400 font-mono text-xs">
                        <span
                          className={`font-semibold ${
                            proc.sourceLine === 'lineA' ? 'text-blue-400' : 'text-emerald-400'
                          }`}
                        >
                          {proc.sourceLine === 'lineA' ? 'Line A' : 'Line B'}
                        </span>{' '}
                        · {proc.line}
                      </td>

                      {/* UPH Live Editable */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-blue-500/80 rounded-md px-1.5 py-1 w-28 focus-within:border-blue-500 transition-colors">
                          <button
                            type="button"
                            onClick={() => handleMasterStep(proc, 'uph', -5, proc.uph)}
                            className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={proc.uph}
                            onChange={(e) => handleMasterNumberInput(proc, 'uph', e.target.value)}
                            className="w-full bg-transparent text-center text-white font-mono font-semibold text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleMasterStep(proc, 'uph', +5, proc.uph)}
                            className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* MP STD Live Editable */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-purple-500/80 rounded-md px-1.5 py-1 w-24 focus-within:border-purple-500 transition-colors">
                          <button
                            type="button"
                            onClick={() => handleMasterStep(proc, 'std', -1, proc.std)}
                            className="text-slate-500 hover:text-purple-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={proc.std}
                            onChange={(e) => handleMasterNumberInput(proc, 'std', e.target.value)}
                            className="w-full bg-transparent text-center text-purple-300 font-mono font-bold text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleMasterStep(proc, 'std', +1, proc.std)}
                            className="text-slate-500 hover:text-purple-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* MP Actual Live Editable */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-emerald-500/80 rounded-md px-1.5 py-1 w-24 focus-within:border-emerald-500 transition-colors">
                          <button
                            type="button"
                            onClick={() => handleMasterStep(proc, 'act', -1, proc.act)}
                            className="text-slate-500 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={proc.act}
                            onChange={(e) => handleMasterNumberInput(proc, 'act', e.target.value)}
                            className="w-full bg-transparent text-center text-emerald-400 font-mono font-bold text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleMasterStep(proc, 'act', +1, proc.act)}
                            className="text-slate-500 hover:text-emerald-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Takt Time Live Editable */}
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
                            onClick={() => handleMasterTaktStep(proc, -0.5)}
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
                            onChange={(e) => handleMasterTaktChange(proc, e.target.value)}
                            className={`w-full bg-transparent text-center font-mono font-semibold text-xs focus:outline-none ${
                              proc.isTaktOverridden ? 'text-amber-300 font-bold' : 'text-slate-300'
                            }`}
                            title="พิมพ์เพื่อกำหนด Takt Time เฉพาะสถานีนี้"
                          />
                          <button
                            type="button"
                            onClick={() => handleMasterTaktStep(proc, +0.5)}
                            title="เพิ่ม Takt Time (+0.5s)"
                            className="text-slate-500 hover:text-amber-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* MP Req Live Editable */}
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
                            onClick={() => handleMasterMpReqStep(proc, -0.1)}
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
                            onChange={(e) => handleMasterMpReqChange(proc, e.target.value)}
                            className={`w-full bg-transparent text-center font-mono font-bold text-xs focus:outline-none ${
                              proc.isMpReqOverridden ? 'text-blue-300' : 'text-blue-400'
                            }`}
                            title="พิมพ์เพื่อกำหนด MP Req เอง"
                          />
                          <button
                            type="button"
                            onClick={() => handleMasterMpReqStep(proc, +0.1)}
                            title="เพิ่ม MP Req (+0.1)"
                            className="text-slate-500 hover:text-blue-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Gap Live Editable */}
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
                            onClick={() => handleMasterGapStep(proc, -0.5)}
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
                            onChange={(e) => handleMasterGapChange(proc, e.target.value)}
                            className={`w-full bg-transparent text-center font-mono font-bold text-xs focus:outline-none ${
                              proc.gap > 1
                                ? 'text-amber-400'
                                : proc.gap < -1
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                            title="พิมพ์เพื่อกำหนด Gap เอง"
                          />
                          <button
                            type="button"
                            onClick={() => handleMasterGapStep(proc, +0.5)}
                            title="เพิ่ม Gap (+0.5)"
                            className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Status Live Select */}
                      <td className="p-3">
                        <select
                          value={proc.customStatus || 'auto'}
                          onChange={(e) => handleMasterStatusChange(proc, e.target.value)}
                          className={`rounded px-2 py-1 text-xs font-medium border focus:outline-none transition-colors ${
                            proc.status === 'shortage'
                              ? 'bg-rose-950 text-rose-300 border-rose-700/80'
                              : proc.status === 'surplus'
                              ? 'bg-amber-950 text-amber-300 border-amber-700/80'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700/80'
                          }`}
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

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(proc.isTaktOverridden || proc.isMpReqOverridden || proc.isGapOverridden || proc.isStatusOverridden) && (
                            <button
                              type="button"
                              onClick={() => handleResetMasterRow(proc)}
                              title="คืนค่าแถวนี้กลับเป็นสูตรคำนวณอัตโนมัติ"
                              className="p-1 text-amber-400 hover:text-amber-200 hover:bg-slate-700/60 rounded transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onNavigateToLine(proc.sourceLine)}
                            className="text-xs text-slate-400 hover:text-white underline decoration-slate-600"
                          >
                            เปิด Sheet
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Footer Row */}
            <tfoot className="bg-slate-900/90 text-slate-300 font-semibold border-t-2 border-slate-700 text-xs">
              <tr>
                <td className="p-3">
                  รวมทั้งหมด ({filteredProcesses.length} กระบวนการ)
                </td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 text-purple-300 font-mono text-sm">
                  {filteredProcesses.reduce((a, b) => a + b.std, 0)}
                </td>
                <td className="p-3 text-emerald-400 font-mono text-sm">
                  {filteredProcesses.reduce((a, b) => a + b.act, 0)}
                </td>
                <td className="p-3 text-slate-400">-</td>
                <td className="p-3 text-blue-400 font-mono text-sm">
                  {filteredProcesses.reduce((a, b) => a + b.mpReq, 0).toFixed(1)}
                </td>
                <td className="p-3 font-mono">
                  {(() => {
                    const sumAct = filteredProcesses.reduce((a, b) => a + b.act, 0);
                    const sumReq = filteredProcesses.reduce((a, b) => a + b.mpReq, 0);
                    const diff = sumAct - sumReq;
                    return (
                      <span
                        className={
                          diff > 1
                            ? 'text-amber-400'
                            : diff < -1
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }
                      >
                        {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                      </span>
                    );
                  })()}
                </td>
                <td colSpan={2} className="p-3 text-slate-400 font-normal">
                  บันทึกข้อมูลอัตโนมัติแบบเรียลไทม์
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
