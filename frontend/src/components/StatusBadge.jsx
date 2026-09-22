import React from 'react';
import { CheckCircle2, Clock, XCircle, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const s = (status || 'Pending').toLowerCase();

  if (s.includes('approved')) {
    return (
      <span className="badge-green">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  }
  if (s.includes('reject')) {
    return (
      <span className="badge-red">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  }
  if (s.includes('info') || s.includes('review')) {
    return (
      <span className="badge-blue">
        <HelpCircle className="w-3 h-3" /> Info Requested
      </span>
    );
  }
  return (
    <span className="badge-orange">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

export function VerdictBadge({ verdict, matchScore }) {
  const score = matchScore !== undefined ? Number(matchScore) : 85;

  if (score < 50 || (verdict && verdict.toLowerCase().includes('flag'))) {
    return (
      <span className="badge-red">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Flagged ({Math.round(score)}%)
      </span>
    );
  }
  if (score < 80 || (verdict && (verdict.toLowerCase().includes('discrepan') || verdict.toLowerCase().includes('partial')))) {
    return (
      <span className="badge-orange">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Partial ({Math.round(score)}%)
      </span>
    );
  }
  return (
    <span className="badge-green">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Verified ({Math.round(score)}%)
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const sev = (severity || 'Minor').toLowerCase();
  if (sev === 'severe' || sev === 'critical') {
    return <span className="badge-red">Severe</span>;
  }
  if (sev === 'moderate') {
    return <span className="badge-orange">Moderate</span>;
  }
  return <span className="badge-green">Minor</span>;
}

export function CostBadge({ costMin, costMax }) {
  if (!costMin && !costMax) {
    return <span className="text-[#9CA3AF] text-xs">Evaluating...</span>;
  }
  return (
    <span className="font-mono text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg">
      ₹{Number(costMin).toLocaleString('en-IN')} – ₹{Number(costMax).toLocaleString('en-IN')}
    </span>
  );
}
