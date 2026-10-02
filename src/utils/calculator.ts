import {
  CalculatedProcess,
  ProcessItem,
  ProductionParams,
  SummaryKpi,
  PlantSummaryKpi,
} from '../types';

export function calculateManpower(
  processes: ProcessItem[],
  params: ProductionParams
): {
  calculatedList: CalculatedProcess[];
  kpi: SummaryKpi;
} {
  const { workTime, efficiency, shifts, dailyPlan, customTaktTime } = params;
  const safeWorkTime = workTime > 0 ? workTime : 28800;
  const safeEff = efficiency > 0 ? efficiency : 0.8;
  const safeShifts = shifts > 0 ? shifts : 2;
  const safeDailyPlan = dailyPlan >= 0 ? dailyPlan : 0;

  const planPerShift = safeShifts > 0 ? safeDailyPlan / safeShifts : 0;
  const calculatedTaktTime =
    planPerShift > 0 ? (safeWorkTime * safeEff) / planPerShift : 0;

  // Use line-level custom takt time override if specified, otherwise formula
  const defaultLineTaktTime =
    customTaktTime !== undefined && customTaktTime > 0
      ? customTaktTime
      : calculatedTaktTime;

  let totalMpReq = 0;
  let totalMpAct = 0;
  let totalMpStd = 0;
  let bottlenecksCount = 0;
  let shortageCount = 0;
  let surplusCount = 0;
  let balancedCount = 0;

  const calculatedList: CalculatedProcess[] = processes.map((proc) => {
    const uphSafe = proc.uph > 0 ? proc.uph : 1;
    const cycleTime = 3600 / uphSafe;

    // Determine Takt Time used: process override > line override > formula
    const taktTimeUsed =
      proc.customTaktTime !== undefined && proc.customTaktTime > 0
        ? proc.customTaktTime
        : defaultLineTaktTime;

    const isTaktOverridden =
      (proc.customTaktTime !== undefined && proc.customTaktTime > 0) ||
      (customTaktTime !== undefined && customTaktTime > 0);

    // Determine MP Required: process custom override > formula (cycleTime / taktTime)
    let mpReq = 0;
    const isMpReqOverridden = proc.customMpReq !== undefined && proc.customMpReq >= 0;
    if (isMpReqOverridden) {
      mpReq = proc.customMpReq!;
    } else {
      mpReq = taktTimeUsed > 0 ? cycleTime / taktTimeUsed : 0;
    }

    totalMpReq += mpReq;
    totalMpAct += proc.act;
    totalMpStd += proc.std;

    // Determine Gap: process custom override > formula (act - mpReq)
    let gap = 0;
    const isGapOverridden = proc.customGap !== undefined;
    if (isGapOverridden) {
      gap = proc.customGap!;
    } else {
      gap = proc.act - mpReq;
    }

    // Determine Status: custom override > formula
    let status: 'balanced' | 'shortage' | 'surplus' = 'balanced';
    const isStatusOverridden = proc.customStatus !== undefined;
    if (isStatusOverridden) {
      status = proc.customStatus!;
    } else {
      if (gap < -1) {
        status = 'shortage';
      } else if (gap > 1) {
        status = 'surplus';
      }
    }

    if (status === 'shortage') shortageCount += 1;
    else if (status === 'surplus') surplusCount += 1;
    else balancedCount += 1;

    const isBottleneck = taktTimeUsed > 0 && cycleTime > taktTimeUsed;
    if (isBottleneck) {
      bottlenecksCount += 1;
    }

    return {
      ...proc,
      cycleTime,
      mpReq,
      gap,
      status,
      isBottleneck,
      taktTimeUsed,
      isMpReqOverridden,
      isGapOverridden,
      isTaktOverridden,
      isStatusOverridden,
    };
  });

  const totalGap = totalMpAct - totalMpReq;
  const balancingRate =
    totalMpAct > 0 ? Math.min(100, Math.round((totalMpReq / totalMpAct) * 100)) : 0;

  return {
    calculatedList,
    kpi: {
      totalMpReq,
      totalMpAct,
      totalMpStd,
      totalGap,
      taktTime: defaultLineTaktTime,
      planPerShift,
      balancingRate,
      bottlenecksCount,
      shortageCount,
      surplusCount,
      balancedCount,
      isTaktOverridden: customTaktTime !== undefined && customTaktTime > 0,
    },
  };
}

export function calculatePlantSummary(
  lineAProcesses: ProcessItem[],
  lineAParams: ProductionParams,
  lineBProcesses: ProcessItem[],
  lineBParams: ProductionParams
): {
  lineACalculated: CalculatedProcess[];
  lineBCalculated: CalculatedProcess[];
  plantKpi: PlantSummaryKpi;
} {
  const lineA = calculateManpower(lineAProcesses, lineAParams);
  const lineB = calculateManpower(lineBProcesses, lineBParams);

  const totalDailyPlan = lineAParams.dailyPlan + lineBParams.dailyPlan;
  const totalPlanPerShift = lineA.kpi.planPerShift + lineB.kpi.planPerShift;
  const totalMpReq = lineA.kpi.totalMpReq + lineB.kpi.totalMpReq;
  const totalMpAct = lineA.kpi.totalMpAct + lineB.kpi.totalMpAct;
  const totalMpStd = lineA.kpi.totalMpStd + lineB.kpi.totalMpStd;
  const totalGap = totalMpAct - totalMpReq;

  const avgBalancingRate =
    totalMpAct > 0 ? Math.min(100, Math.round((totalMpReq / totalMpAct) * 100)) : 0;

  return {
    lineACalculated: lineA.calculatedList,
    lineBCalculated: lineB.calculatedList,
    plantKpi: {
      totalDailyPlan,
      totalPlanPerShift,
      totalMpReq,
      totalMpAct,
      totalMpStd,
      totalGap,
      avgBalancingRate,
      lineAKpi: lineA.kpi,
      lineBKpi: lineB.kpi,
      totalBottlenecks: lineA.kpi.bottlenecksCount + lineB.kpi.bottlenecksCount,
      totalShortage: lineA.kpi.shortageCount + lineB.kpi.shortageCount,
      totalSurplus: lineA.kpi.surplusCount + lineB.kpi.surplusCount,
      totalBalanced: lineA.kpi.balancedCount + lineB.kpi.balancedCount,
    },
  };
}
