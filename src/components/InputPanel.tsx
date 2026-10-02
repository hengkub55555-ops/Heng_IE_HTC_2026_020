import React from 'react';
import { ProductionParams } from '../types';
import { Clock, Gauge, Calendar, Target, Zap, Plus, Minus } from 'lucide-react';

interface InputPanelProps {
  params: ProductionParams;
  onChange: (key: keyof ProductionParams, val: number) => void;
  taktTime: number;
  planPerShift: number;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  params,
  onChange,
  taktTime,
  planPerShift,
}) => {
  return (
    <div className="space-y-3">
      {/* 4 Inputs Grid matching user specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Work Time */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="workTime"
              className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"
            >
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Work Time (วินาที/Shift)
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {(params.workTime / 3600).toFixed(1)} ชม.
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded p-1 focus-within:border-blue-500 transition-colors">
            <button
              type="button"
              onClick={() => onChange('workTime', Math.max(3600, params.workTime - 600))}
              title="ลดเวลาทำงาน (-10 นาที)"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              id="workTime"
              type="number"
              value={params.workTime || ''}
              onChange={(e) => onChange('workTime', parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-center text-white font-semibold text-lg focus:outline-none"
              placeholder="28800"
            />
            <button
              type="button"
              onClick={() => onChange('workTime', params.workTime + 600)}
              title="เพิ่มเวลาทำงาน (+10 นาที)"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[
              { label: '7.5 ชม.', val: 27000 },
              { label: '8 ชม. (std)', val: 28800 },
              { label: '8.5 ชม.', val: 30600 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onChange('workTime', preset.val)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  params.workTime === preset.val
                    ? 'bg-blue-950 text-blue-300 border-blue-600'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Efficiency */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="efficiency"
              className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Efficiency (Eff %)
            </label>
            <span className="text-[11px] font-semibold text-emerald-400">
              {Math.round(params.efficiency * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded p-1 focus-within:border-emerald-500 transition-colors">
            <button
              type="button"
              onClick={() =>
                onChange('efficiency', Math.max(0.1, parseFloat((params.efficiency - 0.05).toFixed(2))))
              }
              title="ลด Eff (-5%)"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              id="efficiency"
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              value={params.efficiency || ''}
              onChange={(e) => onChange('efficiency', parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-center text-white font-semibold text-lg focus:outline-none"
              placeholder="0.80"
            />
            <button
              type="button"
              onClick={() =>
                onChange('efficiency', Math.min(1.0, parseFloat((params.efficiency + 0.05).toFixed(2))))
              }
              title="เพิ่ม Eff (+5%)"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[
              { label: '75%', val: 0.75 },
              { label: '80% (std)', val: 0.8 },
              { label: '85%', val: 0.85 },
              { label: '90%', val: 0.9 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onChange('efficiency', preset.val)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  params.efficiency === preset.val
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shifts / Day */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="shifts"
              className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Shifts / Day
            </label>
            <span className="text-[11px] text-slate-500">
              {params.shifts === 1 ? '1 กะ' : params.shifts === 2 ? '2 กะ (เช้า/ดึก)' : '3 กะ (24 ชม.)'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded p-1 focus-within:border-purple-500 transition-colors">
            <button
              type="button"
              onClick={() => onChange('shifts', Math.max(1, params.shifts - 1))}
              title="ลดจำนวนกะ"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              id="shifts"
              type="number"
              min="1"
              max="4"
              value={params.shifts || ''}
              onChange={(e) => onChange('shifts', parseInt(e.target.value) || 0)}
              className="w-full bg-transparent text-center text-white font-semibold text-lg focus:outline-none"
              placeholder="2"
            />
            <button
              type="button"
              onClick={() => onChange('shifts', Math.min(4, params.shifts + 1))}
              title="เพิ่มจำนวนกะ"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange('shifts', s)}
                className={`text-[10px] px-2.5 py-0.5 rounded border transition-colors ${
                  params.shifts === s
                    ? 'bg-purple-950 text-purple-300 border-purple-600'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {s} กะ/วัน
              </button>
            ))}
          </div>
        </div>

        {/* Daily Plan Qty */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="dailyPlan"
              className="text-xs text-slate-400 flex items-center gap-1.5 font-medium"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Daily Plan Qty (ชิ้น/วัน)
            </label>
            <span className="text-[11px] text-slate-500">
              {(planPerShift || 0).toLocaleString()} /กะ
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded p-1 focus-within:border-amber-500 transition-colors">
            <button
              type="button"
              onClick={() => onChange('dailyPlan', Math.max(0, params.dailyPlan - 50))}
              title="ลดยอดผลิต (-50 ชิ้น)"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              id="dailyPlan"
              type="number"
              value={params.dailyPlan || ''}
              onChange={(e) => onChange('dailyPlan', parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-center text-white font-semibold text-lg focus:outline-none"
              placeholder="3470"
            />
            <button
              type="button"
              onClick={() => onChange('dailyPlan', params.dailyPlan + 50)}
              title="เพิ่มยอดผลิต (+50 ชิ้น)"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[
              { label: '2,800', val: 2800 },
              { label: '3,470 (std)', val: 3470 },
              { label: '4,000', val: 4000 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onChange('dailyPlan', preset.val)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  params.dailyPlan === preset.val
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Takt Time & Shift Summary Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Takt Time คำนวณได้:</span>
            <span className="font-mono font-bold text-blue-400 text-sm">
              {taktTime > 0 ? taktTime.toFixed(2) : '0.00'} วินาที/ชิ้น
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Plan ต่อกะ:</span>
            <span className="font-mono font-bold text-slate-200">
              {planPerShift > 0 ? Math.round(planPerShift).toLocaleString() : '0'} ชิ้น
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">เวลาทำงานสุทธิ (Net Working Time):</span>
            <span className="font-mono font-medium text-slate-300">
              {(params.workTime * params.efficiency).toLocaleString()} วินาที
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Line Speed เป้าหมาย:</span>
          <strong className="text-slate-200 font-mono">
            {taktTime > 0 ? (3600 / taktTime).toFixed(1) : '0'} ชิ้น/ชม.
          </strong>
        </div>
      </div>
    </div>
  );
};
