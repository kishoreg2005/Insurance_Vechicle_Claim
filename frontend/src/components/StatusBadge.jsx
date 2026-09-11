import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, AlertCircle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const s = (status || 'Pending').toLowerCase();
  
  if (s.includes('approved')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
      </span>
    );
  }
  if (s.includes('reject')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" /> Rejected
      </span>
    );
  }
  if (s.includes('info') || s.includes('review')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
        <HelpCircle className="w-3.5 h-3.5" /> Info Requested
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  );
}

export function VerdictBadge({ verdict, matchScore }) {
  const score = matchScore !== undefined ? Number(matchScore) : 85;
  
  if (score < 50 || (verdict && verdict.toLowerCase().includes('flag'))) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        🔴 Flagged - mismatch ({Math.round(score)}%)
      </span>
    );
  }
  if (score < 80 || (verdict && (verdict.toLowerCase().includes('discrepan') || verdict.toLowerCase().includes('partial')))) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        🟡 Manual review needed ({Math.round(score)}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      🟢 Auto-verified ({Math.round(score)}%)
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const sev = (severity || 'Minor').toLowerCase();
  if (sev === 'severe') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        Severe
      </span>
    );
  }
  if (sev === 'moderate') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Moderate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      Minor
    </span>
  );
}

export function CostBadge({ costMin, costMax }) {
  if (!costMin && !costMax) return <span className="text-slate-500 text-xs">Evaluating...</span>;
  return (
    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
      ₹{Number(costMin).toLocaleString('en-IN')} – ₹{Number(costMax).toLocaleString('en-IN')}
    </span>
  );
}

