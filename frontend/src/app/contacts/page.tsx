'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
  BookOpen,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Trash2,
  Grid,
  List,
  X,
  User,
} from 'lucide-react';

interface ContactItem {
  id: string;
  name: string;
  number: string;
  email: string;
  department: string;
  company: string;
}

export default function ContactsPage() {
  const toast = useToast();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    number: '',
    email: '',
    department: 'Sales',
    company: 'Eclype Technology',
  });

  useEffect(() => {
    // Populate from extensions
    api.getExtensions().then((res) => {
      if (res?.extensions) {
        const mapped: ContactItem[] = res.extensions.map((e: any) => ({
          id: e.id,
          name: e.displayName,
          number: e.extensionNumber,
          email: `${e.displayName.toLowerCase().replace(/\s+/g, '.')}@eclypetechnology.local`,
          department: e.department?.name || 'General Staff',
          company: 'Eclype Technology PBX',
        }));
        setContacts(mapped);
      }
    });
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setContacts([
      { ...newContact, id: 'c-' + Date.now() },
      ...contacts,
    ]);
    setShowModal(false);
    toast.success(`Contact "${newContact.name}" added to company directory`, 'Contact Added');
    setNewContact({ name: '', number: '', email: '', department: 'Sales', company: 'Eclype Technology' });
  };

  const handleDial = (target: string) => {
    window.dispatchEvent(new CustomEvent('pbx:dial', { detail: { target } }));
    toast.info(`Connecting to ${target}...`, 'Softphone Dispatch');
  };

  const filtered = contacts.filter((c) => {
    if (selectedDept !== 'ALL' && c.department !== selectedDept) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const departments = ['ALL', ...Array.from(new Set(contacts.map((c) => c.department)))];

  return (
    <div className="space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Company Directory & Contacts
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {contacts.length} Contacts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized address book synchronized with IP deskphones, BLF speed dials, and WebRTC client
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, extension, department, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-medium"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Rendering */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-700">No contacts matching criteria</p>
        </div>
      ) : viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                        {c.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">
                        Ext {c.number}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {c.department}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.company}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-emerald-600 font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Available
                </span>

                <button
                  onClick={() => handleDial(c.number)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  <Phone className="w-3 h-3 fill-current" />
                  <span>Call {c.number}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Contact Name</th>
                <th className="py-2.5 px-4">Extension</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Email Address</th>
                <th className="py-2.5 px-4">Company</th>
                <th className="py-2.5 px-4 text-right">Quick Dial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {c.name}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-sky-600">
                    {c.number}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {c.department}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                    {c.email}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {c.company}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDial(c.number)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200/80 inline-flex items-center gap-1 transition"
                    >
                      <Phone className="w-3 h-3 fill-current text-emerald-600" />
                      <span>Dial</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add Directory Contact</h2>
                  <p className="text-[11px] text-slate-500">Add to company speed-dial phonebook</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Extension / Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1005 or +18005550100"
                  value={newContact.number}
                  onChange={(e) => setNewContact({ ...newContact, number: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john.doe@eclypetechnology.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Department</label>
                  <input
                    type="text"
                    value={newContact.department}
                    onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Company</label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    className="w-full bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs transition"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
