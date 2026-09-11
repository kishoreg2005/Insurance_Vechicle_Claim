import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Database, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { subscribeToConnectionStatus } from '../services/realtimeDb';

export default function RealtimeStatusBadge() {
  const [connected, setConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((status) => {
      setConnected(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
          connected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
        }`}
        title="Click to view Firebase Realtime Database status"
      >
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              connected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </span>
        <span className="hidden sm:inline">
          {connected ? 'Realtime DB Active' : 'Connecting Realtime DB...'}
        </span>
        <Database className="w-3.5 h-3.5 opacity-80" />
      </button>

      {/* Info / Config Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-left relative animate-in fade-in zoom-in duration-150">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Firebase Realtime Database
                  {connected ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Connecting
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Instance: project-final-62be8-default-rtdb
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Database URL:</span>
                <span className="text-primary-300 break-all text-right select-all">
                  https://project-final-62be8-default-rtdb.firebaseio.com
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sync Status:</span>
                <span className={connected ? 'text-emerald-400' : 'text-amber-400'}>
                  {connected ? 'Live duplex synchronization active' : 'Waiting for connection...'}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-primary-400" />
                Fix permission / connection errors
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your Firebase project currently blocks unauthenticated REST access (HTTP 401). Open
                <span className="text-slate-200"> Firebase Console → Realtime Database → Rules</span>,
                paste the rules below, and click Publish. Backend keeps working from local cache until then.
              </p>
              <pre className="text-[11px] bg-slate-950 text-slate-200 p-2.5 rounded-lg border border-slate-800 font-mono overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
