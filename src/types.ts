export type LineId = 'lineA' | 'lineB';
export type ActiveTab = 'lineA' | 'lineB' | 'summary';

export interface ProcessItem {
  id: string;
  name: string;
  line: string;
  uph: number;
  std: number;
  act: number;
  category?: string;
  notes?: string;
  lineId?: LineId;
  customTaktTime?: number; // Optional manual override for takt time
  customMpReq?: number; // Optional manual override for MP Req
  customGap?: number; // Optional manual override for Gap
  customStatus?: 'balanced' | 'shortage' | 'surplus'; // Optional manual override for Status
}

export interface ProductionParams {
  workTime: number; // seconds per shift, e.g. 28800 (8h)
  efficiency: number; // e.g. 0.80
  shifts: number; // e.g. 2
  dailyPlan: number; // e.g. 3470
  customTaktTime?: number; // Optional line-wide manual Takt Time override
}

export interface CalculatedProcess extends ProcessItem {
  cycleTime: number; // CT in seconds = 3600 / uph
  mpReq: number; // CT / taktTime or custom override
  gap: number; // act - mpReq or custom override
  status: 'balanced' | 'shortage' | 'surplus';
  isBottleneck: boolean;
  taktTimeUsed: number;
  isMpReqOverridden: boolean;
  isGapOverridden: boolean;
  isTaktOverridden: boolean;
  isStatusOverridden: boolean;
}

export interface SummaryKpi {
  totalMpReq: number;
  totalMpAct: number;
  totalMpStd: number;
  totalGap: number;
  taktTime: number;
  planPerShift: number;
  balancingRate: number;
  bottlenecksCount: number;
  shortageCount: number;
  surplusCount: number;
  balancedCount: number;
  isTaktOverridden: boolean;
}

export interface LineData {
  id: LineId;
  name: string;
  shortName: string;
  description: string;
  params: ProductionParams;
  processes: ProcessItem[];
  viewMode: 'core' | 'full';
}

export interface PlantSummaryKpi {
  totalDailyPlan: number;
  totalPlanPerShift: number;
  totalMpReq: number;
  totalMpAct: number;
  totalMpStd: number;
  totalGap: number;
  avgBalancingRate: number;
  lineAKpi: SummaryKpi;
  lineBKpi: SummaryKpi;
  totalBottlenecks: number;
  totalShortage: number;
  totalSurplus: number;
  totalBalanced: number;
}
