import React, { useState } from 'react';
import { PlantSummaryKpi, CalculatedProcess, ProductionParams } from '../types';
import {
  FileText,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Printer,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';

interface ExecutiveBriefingProps {
  plantKpi: PlantSummaryKpi;
  lineACalculated: CalculatedProcess[];
  lineBCalculated: CalculatedProcess[];
  lineAParams: ProductionParams;
  lineBParams: ProductionParams;
  compact?: boolean;
}

export const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({
  plantKpi,
  lineACalculated,
  lineBCalculated,
  lineAParams,
  lineBParams,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Identify risk stations across both lines
  const lineABottlenecks = lineACalculated.filter((p) => p.isBottleneck);
  const lineBBottlenecks = lineBCalculated.filter((p) => p.isBottleneck);
  const lineAShortages = lineACalculated.filter((p) => p.status === 'shortage');
  const lineBShortages = lineBCalculated.filter((p) => p.status === 'shortage');
  const lineASurplus = lineACalculated.filter((p) => p.status === 'surplus');
  const lineBSurplus = lineBCalculated.filter((p) => p.status === 'surplus');

  // Overall status rating for Plant Manager
  const totalShortagesCount = lineAShortages.length + lineBShortages.length;
  const isHealthy = plantKpi.totalGap >= -2 && totalShortagesCount <= 2;
  const isWarning = (plantKpi.totalGap < -2 && plantKpi.totalGap >= -6) || (totalShortagesCount > 2 && totalShortagesCount <= 4);
  const isCritical = plantKpi.totalGap < -6 || totalShortagesCount > 4;

  const statusBadge = isCritical ? {
    label: 'วิกฤต (ต้องเสริมกำลังคนด่วน)',
    color: 'bg-rose-950/80 text-rose-300 border-rose-700/80',
    icon: AlertTriangle,
    indicatorColor: 'bg-rose-500',
  } : isWarning ? {
    label: 'เฝ้าระวัง (มีสถานีคนตึงตัว/คอขวด)',
    color: 'bg-amber-950/80 text-amber-300 border-amber-700/80',
    icon: AlertTriangle,
    indicatorColor: 'bg-amber-500',
  } : {
    label: 'ปกติสมบูรณ์ (พร้อมผลิตตามแผน)',
    color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80',
    icon: CheckCircle2,
    indicatorColor: 'bg-emerald-500',
  };

  // Generate executive summary text suitable for LINE app, Email, or management briefing
  const generateManagementReportText = () => {
    const today = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const text = `📊 [สรุปรายงานผู้จัดการโรงงาน - HAIER MANPOWER INTELLIGENCE]
🗓 รอบข้อมูล: ${today} | 2 กะ/วัน

🟢 1. สรุปสถานการณ์ภาพรวม (Executive Summary)
- สถานะความพร้อม: ${statusBadge.label}
- แผนการผลิตรวม 2 สาย: ${plantKpi.totalDailyPlan.toLocaleString()} ชิ้น/วัน (${Math.round(plantKpi.totalPlanPerShift).toLocaleString()} ชิ้น/กะ)
- กำลังคนเข้างานจริง (Actual): ${plantKpi.totalMpAct} คน (กรอบมาตรฐาน STD: ${plantKpi.totalMpStd} คน)
- กำลังคนที่ต้องการตามจังหวะผลิต (Required): ${plantKpi.totalMpReq.toFixed(1)} คน
- ส่วนต่างรวม (Gap Act - Req): ${plantKpi.totalGap > 0 ? '+' : ''}${plantKpi.totalGap.toFixed(1)} คน (${plantKpi.totalGap < -1 ? 'คนขาด' : plantKpi.totalGap > 1 ? 'คนเกิน' : 'กำลังคนสมดุล'})
- อัตราสมดุลกำลังคนเฉลี่ย: ${plantKpi.avgBalancingRate}%

🏭 2. รายละเอียดแยกสายการผลิต
• Line A (ตู้เย็น A):
  - แผนผลิต: ${lineAParams.dailyPlan.toLocaleString()} ชิ้น/วัน | Takt Time: ${plantKpi.lineAKpi.taktTime.toFixed(2)} วินาที/ชิ้น
  - กำลังคน: จริง ${plantKpi.lineAKpi.totalMpAct} คน (ต้องการ ${plantKpi.lineAKpi.totalMpReq.toFixed(1)} คน, Gap ${plantKpi.lineAKpi.totalGap > 0 ? '+' : ''}${plantKpi.lineAKpi.totalGap.toFixed(1)})
  - ประสิทธิภาพ (Eff): ${Math.round(lineAParams.efficiency * 100)}% | คอขวด: ${lineABottlenecks.length} จุด

• Line B (ตู้เย็น B):
  - แผนผลิต: ${lineBParams.dailyPlan.toLocaleString()} ชิ้น/วัน | Takt Time: ${plantKpi.lineBKpi.taktTime.toFixed(2)} วินาที/ชิ้น
  - กำลังคน: จริง ${plantKpi.lineBKpi.totalMpAct} คน (ต้องการ ${plantKpi.lineBKpi.totalMpReq.toFixed(1)} คน, Gap ${plantKpi.lineBKpi.totalGap > 0 ? '+' : ''}${plantKpi.lineBKpi.totalGap.toFixed(1)})
  - ประสิทธิภาพ (Eff): ${Math.round(lineBParams.efficiency * 100)}% | คอขวด: ${lineBBottlenecks.length} จุด

⚠️ 3. จุดคอขวดและสถานีที่ต้องจับตา (Bottleneck & Risk Stations)
${lineABottlenecks.length + lineBBottlenecks.length === 0 ? '- ไม่มีสถานีคอขวดวิกฤต ทุกจุดทำงานทัน Takt Time' : [
  ...lineABottlenecks.map((p) => `- [Line A] ${p.name}: CT ${p.cycleTime.toFixed(1)}s (ช้ากว่า Takt ${(p.cycleTime - plantKpi.lineAKpi.taktTime).toFixed(1)}s)`),
  ...lineBBottlenecks.map((p) => `- [Line B] ${p.name}: CT ${p.cycleTime.toFixed(1)}s (ช้ากว่า Takt ${(p.cycleTime - plantKpi.lineBKpi.taktTime).toFixed(1)}s)`),
].join('\n')}

💡 4. ข้อเสนอแนะเชิงบริหาร (Action Directives)
1. ${lineASurplus.length > 0 || lineBSurplus.length > 0
  ? `ดำเนินการเกลี่ยกำลังคน (Rebalance) จากสถานีที่มีคนเกิน (${lineASurplus.length + lineBSurplus.length} จุด) ไปช่วยสถานีคอขวดทันที`
  : 'กำลังคนกระจายตัวอย่างสมดุล ไม่พบจุดที่มีคนเกินผิดปกติ'}
2. รักษาเสถียรภาพประสิทธิภาพเครื่องจักร (OEE) ให้อยู่ในระดับ ${Math.round(((lineAParams.efficiency + lineBParams.efficiency) / 2) * 100)}% เพื่อไม่ให้ Takt Time ตึงตัว
3. หากมีคำสั่งเร่งยอดผลิตฉุกเฉิน (+10%) แนะนำพิจารณาเพิ่ม OT 45 นาที แทนการรับพนักงานเพิ่มชั่วคราว`;

    return text;
  };

  const handleCopy = () => {
    const text = generateManagementReportText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const StatusIcon = statusBadge.icon;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-blue-500/40 rounded-xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 shrink-0">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60 font-mono">
                EXECUTIVE BRIEFING
              </span>
              <span className="text-xs text-slate-400">
                สำหรับผู้จัดการโรงงาน (Plant Manager Executive Summary)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 tracking-tight">
              ข้อสรุปสถานการณ์กำลังคนและแผนการผลิตประจำวัน
            </h2>
          </div>
        </div>

        {/* Action Buttons: Copy for LINE / Email & Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอกสรุปข้อความสำหรับส่ง LINE หรือ Email ให้ผู้จัดการโรงงาน"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>คัดลอกรายงานแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกสรุปส่ง LINE / ผู้บริหาร</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="พิมพ์หน้านี้ / บันทึกเป็น PDF"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors text-xs flex items-center gap-1 px-2.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors"
            title={isExpanded ? 'ย่อสรุป' : 'ขยายสรุป'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      {isExpanded && (
        <div className="p-5 space-y-5 text-sm">
          {/* Executive Verdict Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <span className={`w-3.5 h-3.5 rounded-full ${statusBadge.indicatorColor} inline-block animate-pulse`}></span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    การประเมินสถานการณ์โดยรวม:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold border inline-flex items-center gap-1.5 ${statusBadge.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>
                <p className="text-slate-200 font-medium text-sm mt-1 leading-relaxed">
                  โรงงานมีกำลังคนเข้างานจริง{' '}
                  <strong className="text-emerald-400 font-mono text-base">{plantKpi.totalMpAct} คน</strong>{' '}
                  (STD รวม {plantKpi.totalMpStd} คน) รองรับเป้าหมายการผลิตรวม{' '}
                  <strong className="text-amber-400 font-mono text-base">{plantKpi.totalDailyPlan.toLocaleString()} ชิ้น/วัน</strong>{' '}
                  ได้เต็มศักยภาพ โดยมีความต้องการตามจังหวะเวลา{' '}
                  <strong className="text-blue-400 font-mono">{plantKpi.totalMpReq.toFixed(1)} คน</strong>{' '}
                  (ส่วนต่างสุทธิ {plantKpi.totalGap > 0 ? `+${plantKpi.totalGap.toFixed(1)}` : plantKpi.totalGap.toFixed(1)} คน, ความสมดุล {plantKpi.avgBalancingRate}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <div className="text-center px-2 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 block">ยอดผลิตรวม</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {plantKpi.totalDailyPlan.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">ชิ้น/วัน</span>
              </div>
              <div className="text-center px-2 border-r border-slate-800">
                <span className="text-[10px] text-slate-400 block">คนเข้ากะจริง</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {plantKpi.totalMpAct}
                </span>
                <span className="text-[10px] text-slate-500 block">คน (Actual)</span>
              </div>
              <div className="text-center px-2">
                <span className="text-[10px] text-slate-400 block">คอขวดทั้งโรงงาน</span>
                <span className={`text-base font-bold font-mono ${plantKpi.totalBottlenecks > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {plantKpi.totalBottlenecks}
                </span>
                <span className="text-[10px] text-slate-500 block">สถานี</span>
              </div>
            </div>
          </div>

          {/* 3 Executive Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Line A vs Line B Health */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  1. สถานะแยกตามสายการผลิต
                </span>
                <span className="text-[10px] font-mono text-slate-500">2 สาย</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-950/60 rounded border border-blue-900/40">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-blue-400">Line A (ตู้เย็น A)</span>
                    <span className="text-slate-300 font-mono">{lineAParams.dailyPlan.toLocaleString()} ชิ้น/วัน</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 mt-1">
                    <span>คนจริง <strong>{plantKpi.lineAKpi.totalMpAct}</strong> (ต้องการ {plantKpi.lineAKpi.totalMpReq.toFixed(1)})</span>
                    <span className={plantKpi.lineAKpi.totalGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Gap {plantKpi.lineAKpi.totalGap > 0 ? `+${plantKpi.lineAKpi.totalGap.toFixed(1)}` : plantKpi.lineAKpi.totalGap.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Takt Time: {plantKpi.lineAKpi.taktTime.toFixed(1)}s</span>
                    <span>สมดุล: {plantKpi.lineAKpi.balancingRate}%</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded border border-emerald-900/40">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-emerald-400">Line B (ตู้เย็น B)</span>
                    <span className="text-slate-300 font-mono">{lineBParams.dailyPlan.toLocaleString()} ชิ้น/วัน</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 mt-1">
                    <span>คนจริง <strong>{plantKpi.lineBKpi.totalMpAct}</strong> (ต้องการ {plantKpi.lineBKpi.totalMpReq.toFixed(1)})</span>
                    <span className={plantKpi.lineBKpi.totalGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Gap {plantKpi.lineBKpi.totalGap > 0 ? `+${plantKpi.lineBKpi.totalGap.toFixed(1)}` : plantKpi.lineBKpi.totalGap.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Takt Time: {plantKpi.lineBKpi.taktTime.toFixed(1)}s</span>
                    <span>สมดุล: {plantKpi.lineBKpi.balancingRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: Critical Bottlenecks & Station Watchlist */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  2. สถานีที่ต้องจับตาเป็นพิเศษ (Watchlist)
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  {plantKpi.totalBottlenecks + plantKpi.totalShortage} จุด
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {plantKpi.totalBottlenecks === 0 && plantKpi.totalShortage === 0 ? (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded text-emerald-300 text-center">
                    ✓ ทุกกระบวนการมีความเร็วสอดคล้องกับ Takt Time และไม่มีสถานีคนขาด
                  </div>
                ) : (
                  <>
                    {/* Line A Bottlenecks */}
                    {lineABottlenecks.slice(0, 2).map((proc) => (
                      <div
                        key={proc.id}
                        className="p-2 bg-slate-950/60 rounded border border-amber-800/40 text-slate-300"
                      >
                        <div className="flex justify-between font-medium">
                          <span className="text-amber-300 font-semibold">[Line A] {proc.name}</span>
                          <span className="text-amber-400 font-mono text-[11px]">CT {proc.cycleTime.toFixed(1)}s &gt; TT</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          UPH {proc.uph} | คนจริง {proc.act} (ต้องการ {proc.mpReq.toFixed(1)})
                        </p>
                      </div>
                    ))}

                    {/* Line B Bottlenecks */}
                    {lineBBottlenecks.slice(0, 2).map((proc) => (
                      <div
                        key={proc.id}
                        className="p-2 bg-slate-950/60 rounded border border-amber-800/40 text-slate-300"
                      >
                        <div className="flex justify-between font-medium">
                          <span className="text-amber-300 font-semibold">[Line B] {proc.name}</span>
                          <span className="text-amber-400 font-mono text-[11px]">CT {proc.cycleTime.toFixed(1)}s &gt; TT</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          UPH {proc.uph} | คนจริง {proc.act} (ต้องการ {proc.mpReq.toFixed(1)})
                        </p>
                      </div>
                    ))}

                    {/* Shortage notice if any */}
                    {(lineAShortages.length > 0 || lineBShortages.length > 0) && (
                      <p className="text-[11px] text-rose-400 font-medium">
                        ⚠️ พบสถานีที่มีคนขาด (Gap &lt; -1): รวม {lineAShortages.length + lineBShortages.length} จุด
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Pillar 3: Actionable Manager Directives */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  3. ข้อเสนอแนะเชิงบริหาร (Action Plan)
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">IE Recommended</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800 text-slate-300 space-y-1">
                  <span className="font-semibold text-white block">
                    1. Rebalance กำลังคนจุดเกิน:
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    เกลี่ยกำลังคนจากจุดที่มีคนเกิน ({lineASurplus.length + lineBSurplus.length} สถานี) เข้าช่วยสถานีคอขวด เพื่อป้องกันงานสะสมระหว่างสถานี (WIP accumulation)
                  </p>
                </div>

                <div className="p-2 bg-slate-950/60 rounded border border-slate-800 text-slate-300 space-y-1">
                  <span className="font-semibold text-white block">
                    2. การควบคุมความเร็วสาย (Line Speed):
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    เป้าหมาย Line A: {(3600 / plantKpi.lineAKpi.taktTime).toFixed(0)} ชิ้น/ชม. | Line B: {(3600 / plantKpi.lineBKpi.taktTime).toFixed(0)} ชิ้น/ชม. หากทำตามอัตรานี้จะบรรลุเป้าหมายกะละ {Math.round(plantKpi.totalPlanPerShift).toLocaleString()} ชิ้น
                  </p>
                </div>

                <div className="p-2 bg-slate-950/60 rounded border border-slate-800 text-slate-300 space-y-1">
                  <span className="font-semibold text-white block">
                    3. การรับมือยอดผลิตผันผวน:
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    สามารถใช้เครื่องมือจำลอง <em>Plant What-If</em> ด้านล่าง เพื่อทดลองประเมินการเปิด OT หรือปรับ Efficiency ก่อนตัดสินใจเพิ่ม/ลดคน
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Copy Snippet Preview */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                พร้อมส่งต่อสรุปนี้เข้าห้อง LINE ผู้บริหารหรือรายงานตอนประชุมเช้า (Morning Briefing) ได้ทันที
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-blue-400 hover:text-blue-300 underline font-medium shrink-0 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>คลิกเพื่อคัดลอกข้อความสรุปฉบับย่อ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
