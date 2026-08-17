/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calculator,
  FileText,
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  Loader2,
  AlertCircle,
  Settings,
  ChevronLeft,
  Save,
  Check
} from 'lucide-react';
import { PricingAnalysis, JobDetails } from './types';
import { defaultPriceBook } from './pricebook';

import { CalculatorPopup } from './components/Calculator';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
  const [savedSettings, setSavedSettings] = useState(false);

  const [jobDetails, setJobDetails] = useState<JobDetails>(() => {
    const savedPriceBook = localStorage.getItem('customPriceBook');
    return {
      serviceNotes: '',
      marketContext: 'Standard / Normal Demand',
      priceBook: savedPriceBook || defaultPriceBook
    };
  });
  
  const [analysis, setAnalysis] = useState<PricingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setJobDetails(prev => ({ ...prev, priceBook: event.target!.result as string }));
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('customPriceBook', jobDetails.priceBook);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  const handleResetSettings = () => {
    localStorage.removeItem('customPriceBook');
    setJobDetails(prev => ({ ...prev, priceBook: defaultPriceBook }));
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  const analyzeNotes = async (e?: React.FormEvent, force: boolean = false) => {
    if (e) e.preventDefault();
    if (!jobDetails.serviceNotes) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: jobDetails.serviceNotes,
          marketContext: jobDetails.marketContext,
          priceBook: jobDetails.priceBook,
          forceOverride: force
        })
      });

      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`Server returned an invalid response. If deploying on Vercel, check the deployment logs. Response snippet: ${textResponse.substring(0, 50)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze notes');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-auto">
      <div className="flex flex-col flex-1">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">HVAC Job Pricer</h1>
              <p className="text-xs text-slate-500">Office Manager Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCalcOpen(!calcOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Calculator</span>
            </button>
            <button 
              onClick={() => setView(view === 'dashboard' ? 'settings' : 'dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors"
            >
              {view === 'dashboard' ? <Settings className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span className="hidden sm:inline">{view === 'dashboard' ? 'Settings' : 'Back'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 flex flex-col items-center">
          {view === 'settings' ? (
            <div className="w-full max-w-3xl space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold">Account Settings</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Custom Price Book
                    </label>
                    <p className="text-sm text-slate-500 mb-4">
                      Upload or paste your company's price book below. This will be linked to your account and used for all future AI estimates. If left blank or reset, the standard industry averages will be used.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-100 cursor-pointer transition-colors">
                          <FileText className="w-4 h-4" />
                          <span>Upload File (CSV, TXT)</span>
                          <input
                            type="file"
                            accept=".txt,.csv,.json"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <textarea
                        name="priceBook"
                        value={jobDetails.priceBook}
                        onChange={handleInputChange}
                        placeholder="e.g. Technician labor: $150/hr, Helper: $75/hr..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-64 resize-none font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetSettings}
                      className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
                    >
                      Reset to Default
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      {savedSettings ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {savedSettings ? 'Saved!' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-7xl grid lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <form onSubmit={analyzeNotes} className="space-y-6">
                
                {/* Service Notes Input */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Service Call Estimation</h2>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Technician Notes</label>
                    <textarea
                      name="serviceNotes"
                      value={jobDetails.serviceNotes}
                      onChange={handleInputChange}
                      required
                      placeholder="Paste notes from a technician's service call here... (e.g. 'Found bad compressor on 3-ton unit, need to replace with new Carrier outside unit. Took about 4 hrs labor last time.')"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-40 resize-none"
                    />
                  </div>
                </div>

                {/* Market Context */}
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-tighter mb-2">Current Demand</label>
                    <select
                      name="marketContext"
                      value={jobDetails.marketContext}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    >
                    <option value="Low Demand / Slow Season">Low Demand / Slow Season</option>
                    <option value="Standard / Normal Demand">Standard / Normal Demand</option>
                    <option value="High Demand / Peak Season">High Demand / Peak Season</option>
                    <option value="Emergency / After Hours">Emergency / After Hours</option>
                  </select>
                </div>
              </div>
                  
                <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm font-mono text-sm text-slate-600 font-bold flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> AI Estimate
                    </div>
                    <div className="text-sm text-slate-600 font-medium">Ready to estimate price from notes.</div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !jobDetails.serviceNotes}
                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Analyzing...' : 'Generate Quote'}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Right Column: Analysis Result */}
          <div className="lg:col-span-1 space-y-6">
            
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 items-start justify-between">
                <div className="flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
                {error.toLowerCase().includes('insufficient details') && (
                  <button 
                    onClick={() => analyzeNotes(undefined, true)}
                    className="shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Force Estimate
                  </button>
                )}
              </motion.div>
            )}

            {!analysis && !loading && !error && (
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex flex-col h-full min-h-[400px]">
                <div className="mb-8 flex-1 flex flex-col justify-center text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-8 h-8 text-indigo-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready to Price</h3>
                  <p className="text-indigo-200 text-sm max-w-xs mx-auto">
                    Paste your technician's notes on the left. We'll analyze the requirements and generate an optimal estimate.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex flex-col h-full min-h-[400px] justify-center items-center">
                <Loader2 className="w-10 h-10 text-indigo-200 animate-spin mb-4" />
                <p className="text-white font-bold text-lg">Crunching the numbers...</p>
                <p className="text-sm text-indigo-200 mt-1">Analyzing notes and pricing...</p>
              </div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex flex-col h-full"
              >
                <div className="mb-6">
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Recommended Price</p>
                  <h4 className="text-5xl font-black mt-2">
                    ${analysis.recommendedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h4>
                  <p className="text-indigo-200 text-sm mt-4">Based on competitive market rates + market conditions.</p>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-xs font-bold text-indigo-200 uppercase mb-2 border-b border-indigo-400/30 pb-2">AI Extracted Summary</div>
                    <p className="text-sm font-medium text-white mb-2">{analysis.extractedJobDescription}</p>
                    <div className="flex gap-4 text-indigo-100 text-xs">
                      <span>Est. Labor: <strong className="text-white">{analysis.estimatedLaborHours} hrs</strong></span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Equipment Total</div>
                      <div className="text-lg font-bold">${(analysis.estimatedEquipmentCost + analysis.equipmentMarkup).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4">
                      <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Labor Total</div>
                      <div className="text-lg font-bold">${analysis.laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <div className="text-xs font-bold text-indigo-200 uppercase mb-1">Market Insights</div>
                    <p className="text-xs text-indigo-100 leading-relaxed">{analysis.marketAnalysis}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-indigo-500/30">
                  <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-3">Calculation Reasoning</h3>
                  <ul className="space-y-3">
                    {analysis.breakdown.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-indigo-100">
                        <span className="shrink-0 font-bold opacity-50">{idx + 1}.</span>
                        <span className="leading-relaxed text-xs">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
            
          </div>
            </div>
          )}
        </main>
      </div>
      <CalculatorPopup isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
}
