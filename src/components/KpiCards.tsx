import React from 'react';
import { SummaryKpi } from '../types';
import { Users, UserCheck, ShieldAlert, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardsProps {
  kpi: SummaryKpi;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpi }) => {
  const { totalMpReq, totalMpAct, totalMpStd, totalGap, balancingRate } = kpi;

  // Format gap with + sign if positive
  const formattedGap = (totalGap > 0 ? '+' : '') + totalGap.toFixed(1);

  // Status color logic matching user requirements
  const isSurplus = totalGap > 1;
  const isShortage = totalGap < -1;
  const gapTextColor = isShortage
    ? 'text-rose-400'
    : isSurplus
    ? 'text-amber-400'
    : 'text-emerald-400';

  const gapBorderColor = isShortage
    ? 'border-rose-500'
    : isSurplus
    ? 'border-amber-500'
    : 'border-emerald-500';

  const stdVariance = totalMpAct - totalMpStd;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. MP Required (คน) */}
        <div
          id="cardMpReq"
          className="bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">MP Required (คน)</span>
            <Users className="w-4 h-4 text-blue-400/80" />
          </div>
          <div id="kpiMpReq" className="text-3xl font-bold text-blue-400 mt-1 font-mono">
            {totalMpReq.toFixed(1)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>คำนวณจาก Takt Time &amp; CT</span>
            <span className="font-semibold text-slate-300">
              ≈ {Math.ceil(totalMpReq)} คน (ปัดขึ้น)
            </span>
          </p>
        </div>

        {/* 2. MP Actual (คน) */}
        <div
          id="cardMpAct"
          className="bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 border-emerald-500 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">MP Actual (คน)</span>
            <UserCheck className="w-4 h-4 text-emerald-400/80" />
          </div>
          <div id="kpiMpAct" className="text-3xl font-bold text-emerald-400 mt-1 font-mono">
            {totalMpAct}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>จำนวนคนเข้าทำงานจริงในสาย</span>
            <span className="text-emerald-400 font-medium">ปัจจุบันเข้ากะ</span>
          </p>
        </div>

        {/* 3. MP STD (คน) */}
        <div
          id="cardMpStd"
          className="bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 border-purple-500 shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">MP STD (คน)</span>
            <ShieldAlert className="w-4 h-4 text-purple-400/80" />
          </div>
          <div id="kpiMpStd" className="text-3xl font-bold text-purple-400 mt-1 font-mono">
            {totalMpStd}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>กรอบอัตรากำลังมาตรฐาน (IE)</span>
            <span className="text-purple-300 font-mono text-[10px]">
              {stdVariance >= 0 ? `+${stdVariance}` : stdVariance} เทียบ Actual
            </span>
          </p>
        </div>

        {/* 4. Gap (Act - Req) */}
        <div
          id="cardGap"
          className={`bg-slate-800 border border-slate-700 p-4 rounded-lg border-l-4 ${gapBorderColor} shadow-sm transition-all`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Gap (Act − Req)</span>
            <ArrowUpDown className={`w-4 h-4 ${gapTextColor}`} />
          </div>
          <div id="kpiGap" className={`text-3xl font-bold mt-1 font-mono ${gapTextColor}`}>
            {formattedGap}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">สถานะรวมสาย Line A</span>
            {isShortage ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                <TrendingDown className="w-3 h-3" /> ขาดแคลนคน
              </span>
            ) : isSurplus ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                <TrendingUp className="w-3 h-3" /> มีคนเกินความต้องการ
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                ✓ สมดุลกำลังคน
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Efficiency & Balancing Indicator Bar */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">อัตราการจัดสมดุลกำลังคน (Manpower Utilization):</span>
          <div className="w-36 bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-500 ${
                balancingRate >= 95
                  ? 'bg-emerald-500'
                  : balancingRate >= 80
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, balancingRate))}%` }}
            ></div>
          </div>
          <span className="font-mono font-bold text-slate-200">{balancingRate}%</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div>
            <span>เปรียบเทียบ STD vs Actual: </span>
            <strong
              className={`font-mono ${
                stdVariance === 0
                  ? 'text-slate-200'
                  : stdVariance > 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {stdVariance === 0 ? 'ตรงมาตรฐานพอดี (0)' : stdVariance > 0 ? `เกินมาตรฐาน +${stdVariance} คน` : `ต่ำกว่ามาตรฐาน ${stdVariance} คน`}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
