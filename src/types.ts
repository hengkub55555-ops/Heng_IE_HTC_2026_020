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
}

export interface ProductionParams {
  workTime: number; // seconds per shift, e.g. 28800 (8h)
  efficiency: number; // e.g. 0.80
  shifts: number; // e.g. 2
  dailyPlan: number; // e.g. 3470
}

export interface CalculatedProcess extends ProcessItem {
  cycleTime: number; // CT in seconds = 3600 / uph
  mpReq: number; // CT / taktTime
  gap: number; // act - mpReq
  status: 'balanced' | 'shortage' | 'surplus';
  isBottleneck: boolean;
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
