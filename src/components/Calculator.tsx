import React, { useState } from 'react';
import { X, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalculatorPopup({ isOpen, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (num: string) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleEqual = () => {
    try {
      // safe eval alternative for simple calculator
      const calc = new Function('return ' + equation + display)();
      setDisplay(String(calc));
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDelete = () => {
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-6 right-6 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-50 font-sans"
        >
          <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Quick Calc
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 bg-slate-900">
            <div className="text-right mb-4">
              <div className="text-slate-400 text-xs h-4 font-mono">{equation}</div>
              <div className="text-white text-3xl font-light tracking-tight overflow-hidden text-ellipsis whitespace-nowrap">
                {display}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button onClick={handleClear} className="col-span-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 py-3 rounded-xl text-sm font-semibold transition-colors">AC</button>
              <button onClick={handleDelete} className="bg-slate-800 text-slate-300 hover:bg-slate-700 py-3 rounded-xl flex items-center justify-center transition-colors"><Delete className="w-4 h-4" /></button>
              <button onClick={() => handleOperator('/')} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 py-3 rounded-xl font-semibold transition-colors">÷</button>
              
              {[7, 8, 9].map(n => (
                <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-800 text-white hover:bg-slate-700 py-3 rounded-xl font-medium transition-colors">{n}</button>
              ))}
              <button onClick={() => handleOperator('*')} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 py-3 rounded-xl font-semibold transition-colors">×</button>
              
              {[4, 5, 6].map(n => (
                <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-800 text-white hover:bg-slate-700 py-3 rounded-xl font-medium transition-colors">{n}</button>
              ))}
              <button onClick={() => handleOperator('-')} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 py-3 rounded-xl font-semibold transition-colors">-</button>
              
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-800 text-white hover:bg-slate-700 py-3 rounded-xl font-medium transition-colors">{n}</button>
              ))}
              <button onClick={() => handleOperator('+')} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 py-3 rounded-xl font-semibold transition-colors">+</button>
              
              <button onClick={() => handleNumber('0')} className="col-span-2 bg-slate-800 text-white hover:bg-slate-700 py-3 rounded-xl font-medium transition-colors">0</button>
              <button onClick={() => handleNumber('.')} className="bg-slate-800 text-white hover:bg-slate-700 py-3 rounded-xl font-medium transition-colors">.</button>
              <button onClick={handleEqual} className="bg-indigo-600 text-white hover:bg-indigo-500 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-colors">=</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
