import React, { useEffect, useState } from 'react';
import { Database, X, AlertCircle } from 'lucide-react';
import { subscribeToConnectionStatus } from '../services/realtimeDb';

export default function RealtimeStatusBadge({ compact = false }) {
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
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
          connected
            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
        }`}
        title="Firebase Realtime Database status"
      >
        <span className="relative flex h-1.5 w-1.5">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-green-500' : 'bg-amber-500'}`} />
        </span>
        {!compact && (
          <span className="hidden sm:inline">
            {connected ? 'DB Live' : 'DB Connecting...'}
          </span>
        )}
        <Database className="w-3 h-3" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-green-50' : 'bg-amber-50'}`}>
                  <Database className={`w-5 h-5 ${connected ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-[#06244F] flex items-center gap-2">
                    Firebase Realtime Database
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      connected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {connected ? 'Connected' : 'Connecting'}
                    </span>
                  </h3>
                  <p className="text-xs text-[#6B7280]">project-final-62be8-default-rtdb</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F4F9FF]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F7FAFD] rounded-lg border border-[#E5E7EB] p-3 text-xs font-mono space-y-2">
              <div className="flex justify-between gap-2">
                <span className="text-[#9CA3AF]">Database URL</span>
                <span className="text-[#1268E8] break-all text-right">https://project-final-62be8-default-rtdb.firebaseio.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Sync Status</span>
                <span className={connected ? 'text-green-600 font-semibold' : 'text-amber-600'}>
                  {connected ? 'Live sync active' : 'Waiting for connection...'}
                </span>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 space-y-2">
              <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Fix permission errors
              </h4>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                If seeing 401/403 errors: Firebase Console → Realtime Database → Rules → publish these rules:
              </p>
              <pre className="text-[11px] bg-white text-[#374151] p-2.5 rounded-lg border border-amber-200 font-mono">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
              </pre>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="btn-primary text-xs">Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
