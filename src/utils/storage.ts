import { ProcessItem, ProductionParams, ActiveTab } from '../types';
import {
  INITIAL_PROCESSES_LINE_A,
  INITIAL_PROCESSES_LINE_B,
  DEFAULT_PARAMS_LINE_A,
  DEFAULT_PARAMS_LINE_B,
} from '../data/initialProcesses';

export const STORAGE_KEY = 'haier_mp_intelligence_multiline_v2';
export const LEGACY_STORAGE_KEY = 'haier_mp_line_a_state_v1';

export interface SingleLineStorageData {
  params: ProductionParams;
  processes: ProcessItem[];
  viewMode: 'core' | 'full';
}

export interface MultiLineDashboardState {
  activeTab: ActiveTab;
  lineA: SingleLineStorageData;
  lineB: SingleLineStorageData;
  lastSavedAt: string;
}

export const DEFAULT_MULTI_LINE_STATE: MultiLineDashboardState = {
  activeTab: 'lineA',
  lineA: {
    params: DEFAULT_PARAMS_LINE_A,
    processes: INITIAL_PROCESSES_LINE_A,
    viewMode: 'full',
  },
  lineB: {
    params: DEFAULT_PARAMS_LINE_B,
    processes: INITIAL_PROCESSES_LINE_B,
    viewMode: 'full',
  },
  lastSavedAt: new Date().toLocaleTimeString('th-TH'),
};

export function loadSavedState(): MultiLineDashboardState {
  try {
    // 1. Try to load v2 multi-line state
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.lineA && parsed.lineB) {
        return {
          activeTab:
            parsed.activeTab === 'lineB' || parsed.activeTab === 'summary'
              ? parsed.activeTab
              : 'lineA',
          lineA: {
            params: {
              workTime: Number(parsed.lineA.params?.workTime) || DEFAULT_PARAMS_LINE_A.workTime,
              efficiency: Number(parsed.lineA.params?.efficiency) || DEFAULT_PARAMS_LINE_A.efficiency,
              shifts: Number(parsed.lineA.params?.shifts) || DEFAULT_PARAMS_LINE_A.shifts,
              dailyPlan: Number(parsed.lineA.params?.dailyPlan) || DEFAULT_PARAMS_LINE_A.dailyPlan,
            },
            processes: Array.isArray(parsed.lineA.processes) && parsed.lineA.processes.length > 0
              ? parsed.lineA.processes
              : INITIAL_PROCESSES_LINE_A,
            viewMode: parsed.lineA.viewMode === 'core' ? 'core' : 'full',
          },
          lineB: {
            params: {
              workTime: Number(parsed.lineB.params?.workTime) || DEFAULT_PARAMS_LINE_B.workTime,
              efficiency: Number(parsed.lineB.params?.efficiency) || DEFAULT_PARAMS_LINE_B.efficiency,
              shifts: Number(parsed.lineB.params?.shifts) || DEFAULT_PARAMS_LINE_B.shifts,
              dailyPlan: Number(parsed.lineB.params?.dailyPlan) || DEFAULT_PARAMS_LINE_B.dailyPlan,
            },
            processes: Array.isArray(parsed.lineB.processes) && parsed.lineB.processes.length > 0
              ? parsed.lineB.processes
              : INITIAL_PROCESSES_LINE_B,
            viewMode: parsed.lineB.viewMode === 'core' ? 'core' : 'full',
          },
          lastSavedAt: parsed.lastSavedAt || new Date().toLocaleTimeString('th-TH'),
        };
      }
    }

    // 2. Check for legacy v1 single-line state migration
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (legacyParsed && legacyParsed.params && Array.isArray(legacyParsed.processes)) {
        return {
          activeTab: 'lineA',
          lineA: {
            params: {
              workTime: Number(legacyParsed.params.workTime) || DEFAULT_PARAMS_LINE_A.workTime,
              efficiency: Number(legacyParsed.params.efficiency) || DEFAULT_PARAMS_LINE_A.efficiency,
              shifts: Number(legacyParsed.params.shifts) || DEFAULT_PARAMS_LINE_A.shifts,
              dailyPlan: Number(legacyParsed.params.dailyPlan) || DEFAULT_PARAMS_LINE_A.dailyPlan,
            },
            processes: legacyParsed.processes,
            viewMode: legacyParsed.viewMode === 'core' ? 'core' : 'full',
          },
          lineB: {
            params: DEFAULT_PARAMS_LINE_B,
            processes: INITIAL_PROCESSES_LINE_B,
            viewMode: 'full',
          },
          lastSavedAt: legacyParsed.lastSavedAt || new Date().toLocaleTimeString('th-TH'),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load saved state from localStorage:', err);
  }

  return DEFAULT_MULTI_LINE_STATE;
}

export function saveDashboardState(state: Omit<MultiLineDashboardState, 'lastSavedAt'>): string {
  const timestamp = new Date().toLocaleTimeString('th-TH');
  try {
    const dataToSave: MultiLineDashboardState = {
      ...state,
      lastSavedAt: timestamp,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.error('Failed to auto-save to localStorage:', err);
  }
  return timestamp;
}

export function clearSavedDashboardState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }
}
