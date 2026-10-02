import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { CalculatedProcess } from '../types';
import { BarChart3, LineChart as LineIcon, Activity } from 'lucide-react';

interface ProcessChartProps {
  processes: CalculatedProcess[];
  taktTime: number;
}

export const ProcessChart: React.FC<ProcessChartProps> = ({
  processes,
  taktTime,
}) => {
  const [chartType, setChartType] = useState<'manpower' | 'cycletime'>('manpower');

  // Prepare chart data
  const data = processes.map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 15) + '...' : p.name,
    fullName: p.name,
    line: p.line,
    std: p.std,
    act: p.act,
    req: parseFloat(p.mpReq.toFixed(1)),
    cycleTime: parseFloat(p.cycleTime.toFixed(1)),
    uph: p.uph,
    taktTime: parseFloat(taktTime.toFixed(1)),
  }));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-700 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-slate-200 text-sm">
            การวิเคราะห์เชิงเปรียบเทียบ (Visual Intelligence)
          </h3>
        </div>

        {/* Chart type toggle */}
        <div className="inline-flex p-0.5 bg-slate-900 border border-slate-700 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setChartType('manpower')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              chartType === 'manpower'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>เปรียบเทียบกำลังคน (STD vs ACT vs REQ)</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('cycletime')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              chartType === 'cycletime'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Cycle Time เทียบ Takt Time ({taktTime.toFixed(1)}s)</span>
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        {chartType === 'manpower' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-200">{item.fullName}</p>
                        <p className="text-slate-400">Line: {item.line} | UPH: {item.uph}</p>
                        <div className="pt-1 space-y-1 border-t border-slate-800">
                          <p className="text-purple-400">MP STD: <strong className="text-white">{item.std}</strong> คน</p>
                          <p className="text-emerald-400">MP Actual: <strong className="text-white">{item.act}</strong> คน</p>
                          <p className="text-blue-400">MP Required: <strong className="text-white">{item.req}</strong> คน</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
              />
              <Bar dataKey="std" name="MP STD (คน)" fill="#a855f7" radius={[3, 3, 0, 0]} />
              <Bar dataKey="act" name="MP Actual (คน)" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="req" name="MP Required (คน)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="s" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const diff = item.cycleTime - item.taktTime;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs space-y-1">
                        <p className="font-bold text-slate-200">{item.fullName}</p>
                        <p className="text-amber-400">
                          Cycle Time (3600/UPH): <strong>{item.cycleTime} วินาที</strong>
                        </p>
                        <p className="text-blue-400">
                          Takt Time เป้าหมาย: <strong>{item.taktTime} วินาที</strong>
                        </p>
                        <p className={diff > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {diff > 0
                            ? `⚠️ ช้ากว่า Takt Time +${diff.toFixed(1)} วินาที (Bottleneck)`
                            : `✓ เร็วกว่า Takt Time ${Math.abs(diff).toFixed(1)} วินาที`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
              />
              <ReferenceLine
                y={taktTime}
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `Takt Time (${taktTime.toFixed(1)}s)`,
                  fill: '#38bdf8',
                  fontSize: 11,
                  position: 'top',
                }}
              />
              <Line
                type="monotone"
                dataKey="cycleTime"
                name="Cycle Time (s/unit)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
