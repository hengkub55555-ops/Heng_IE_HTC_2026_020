import React, { useState } from 'react';
import { ProcessItem, LineId } from '../types';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newProcess: ProcessItem) => void;
  lineId?: LineId;
  currentLineName?: string;
}

export const AddProcessModal: React.FC<AddProcessModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  lineId = 'lineA',
  currentLineName = 'Line A',
}) => {
  const [name, setName] = useState('');
  const [line, setLine] = useState('L1');
  const [uph, setUph] = useState(100);
  const [std, setStd] = useState(10);
  const [act, setAct] = useState(10);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณากรอกชื่อกระบวนการ (Process Name)');
      return;
    }
    if (uph <= 0) {
      setError('UPH ต้องมากกว่า 0');
      return;
    }

    onAdd({
      id: `proc-${lineId === 'lineB' ? 'b' : 'a'}-${Date.now()}`,
      name: name.trim(),
      line,
      uph: Number(uph),
      std: Number(std),
      act: Number(act),
      notes: notes.trim(),
      lineId,
    });

    // Reset & close
    setName('');
    setLine('L1');
    setUph(100);
    setStd(10);
    setAct(10);
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">
              เพิ่มกระบวนการผลิต — {currentLineName} (Add Process)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              ชื่อกระบวนการ (Process Name) *
            </label>
            <input
              type="text"
              required
              placeholder="เช่น Assembly Line 3, Brazing Station"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Line / สถานี
              </label>
              <select
                value={line}
                onChange={(e) => setLine(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All (รวม)</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="Main">Main Line</option>
                <option value="QA">QA &amp; Test</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                UPH (Unit Per Hour) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={uph}
                onChange={(e) => setUph(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                MP STD (คนมาตรฐาน)
              </label>
              <input
                type="number"
                min="0"
                value={std}
                onChange={(e) => setStd(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-purple-300 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                MP Actual (คนจริง)
              </label>
              <input
                type="number"
                min="0"
                value={act}
                onChange={(e) => setAct(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-emerald-300 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              หมายเหตุ / รายละเอียดสถานี (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="เช่น จุดตรวจเช็คความปลอดภัย หรือ งานบัดกรีท่อ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>บันทึกกระบวนการ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
