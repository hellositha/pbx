'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  MessageSquare,
  Search,
  Trash2,
  Shield,
  Calendar,
  Download,
  Eye,
  User,
  X,
  FileText,
} from 'lucide-react';

export default function ChatLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([
    {
      id: 'msg-1',
      sender: 'Alice Smith (1001)',
      recipient: 'Bob Jones (1002)',
      timestamp: '2026-10-11 08:30:12 UTC',
      text: 'Good morning Bob, is the London SIP trunk ready for live telephony traffic?',
      channel: 'Direct Message',
    },
    {
      id: 'msg-2',
      sender: 'Bob Jones (1002)',
      recipient: 'Alice Smith (1001)',
      timestamp: '2026-10-11 08:31:05 UTC',
      text: 'Yes Alice, Asterisk PJSIP gateway is registered and all inbound DIDs are routed.',
      channel: 'Direct Message',
    },
    {
      id: 'msg-3',
      sender: 'Alice Smith (1001)',
      recipient: 'Customer Support Group',
      timestamp: '2026-10-11 08:45:00 UTC',
      text: 'Queue 6000 is open for incoming support tickets. Please ensure agents are logged in.',
      channel: 'Channel #support',
    },
    {
      id: 'msg-4',
      sender: 'Super Administrator',
      recipient: 'All Staff Broadcast',
      timestamp: '2026-10-11 09:00:00 UTC',
      text: 'Automated database and dialplan configuration backup completed successfully.',
      channel: 'System Broadcast',
    },
  ]);

  const [search, setSearch] = useState('');
  const [inspectMessage, setInspectMessage] = useState<any | null>(null);

  const filtered = logs.filter(
    (l) =>
      l.sender.toLowerCase().includes(search.toLowerCase()) ||
      l.recipient.toLowerCase().includes(search.toLowerCase()) ||
      l.text.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,Sender,Recipient,Channel,Message'].concat(
        filtered.map((l) => `"${l.timestamp}","${l.sender}","${l.recipient}","${l.channel}","${l.text}"`)
      ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eclypetech_chat_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Chat audit trail exported', 'Export Complete');
  };

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Chat & Messaging Audit Logs
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {logs.length} Entries Archived
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliance archive of Web Client text messages, internal team chats, and system broadcasts
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs shadow-xs transition hover:border-slate-300"
        >
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Search / Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search chat archives by sender, channel, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Showing {filtered.length} of {logs.length} logged messages
        </div>
      </div>

      {/* Chat Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-4 w-44">Timestamp</th>
              <th className="py-2.5 px-4 w-48">Sender</th>
              <th className="py-2.5 px-4 w-48">Recipient / Channel</th>
              <th className="py-2.5 px-4">Message Content</th>
              <th className="py-2.5 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">No chat messages match your search</p>
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {log.sender}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 text-[11px]">
                      {log.recipient}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    {log.text}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => setInspectMessage(log)}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg transition"
                      title="Inspect message metadata"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Message Modal */}
      {inspectMessage && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Message Audit Details</h2>
                  <p className="text-[11px] text-slate-500">Audit record ID {inspectMessage.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectMessage(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans">Timestamp:</span>
                  <span className="text-slate-800 font-bold">{inspectMessage.timestamp}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans">Sender:</span>
                  <span className="text-slate-800">{inspectMessage.sender}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-sans">Channel / Recipient:</span>
                  <span className="text-sky-700 font-bold">{inspectMessage.recipient}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Message Body</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-900 text-xs">
                  {inspectMessage.text}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectMessage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
