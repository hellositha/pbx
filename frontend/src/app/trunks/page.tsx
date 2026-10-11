'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TrunkWizardModal from '@/components/trunks/TrunkWizardModal';
import TrunkDetailsDrawer from '@/components/trunks/TrunkDetailsDrawer';
import TrunkDiagnosticsModal from '@/components/trunks/TrunkDiagnosticsModal';
import ImportProvidersModal from '@/components/trunks/ImportProvidersModal';
import {
  Server,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Shield,
  Radio,
  Layers,
  Globe,
  Sliders,
  Download,
  UploadCloud,
  Send,
  Eye,
  Power,
  PowerOff,
  Star,
  X,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  HardDrive,
  Cpu,
} from 'lucide-react';

export default function TrunksPage() {
  const { showToast } = useToast();
  const [trunks, setTrunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushing, setPushing] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regFilter, setRegFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [transportFilter, setTransportFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<string>('isPrimary');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Row Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Active Dropdown Row Menu ID
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modals & Panels
  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<'SIP_TRUNK' | 'GATEWAY' | 'SBC' | 'BRIDGE'>('SIP_TRUNK');
  const [editingTrunk, setEditingTrunk] = useState<any | null>(null);

  const [detailsTrunk, setDetailsTrunk] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [diagData, setDiagData] = useState<{
    isOpen: boolean;
    trunkName: string;
    trunkId: string;
    data: any | null;
    isTesting: boolean;
  }>({
    isOpen: false,
    trunkName: '',
    trunkId: '',
    data: null,
    isTesting: false,
  });

  const [showImport, setShowImport] = useState(false);

  // Delete & Bulk Confirmation Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    action: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Fetch trunks from backend
  const loadTrunks = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getTrunks();
      setTrunks(data.trunks || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load SIP trunks: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrunks();
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleDocClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = trunks.length;
    const active = trunks.filter((t) => t.enabled).length;
    const registered = trunks.filter((t) => t.status === 'REGISTERED').length;
    const failed = trunks.filter((t) => t.status === 'FAILED').length;
    const activeCalls = trunks.reduce((acc, t) => acc + (t.activeCalls || 0), 0);
    return { total, active, registered, failed, activeCalls };
  }, [trunks]);

  // Unique Providers list for filter
  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    trunks.forEach((t) => {
      if (t.provider) set.add(t.provider);
    });
    return Array.from(set).sort();
  }, [trunks]);

  // Filtering & Sorting
  const filteredTrunks = useMemo(() => {
    let result = [...trunks];

    // Search filter
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(s)) ||
          (t.provider && t.provider.toLowerCase().includes(s)) ||
          (t.serverAddress && t.serverAddress.toLowerCase().includes(s)) ||
          (t.description && t.description.toLowerCase().includes(s)) ||
          (t.inboundDids && t.inboundDids.toLowerCase().includes(s))
      );
    }

    // Status filter
    if (statusFilter === 'ACTIVE') {
      result = result.filter((t) => t.enabled);
    } else if (statusFilter === 'DISABLED') {
      result = result.filter((t) => !t.enabled);
    } else if (statusFilter === 'FAILED') {
      result = result.filter((t) => t.status === 'FAILED');
    }

    // Registration filter
    if (regFilter === 'REGISTERED') {
      result = result.filter((t) => t.status === 'REGISTERED' && t.authMode !== 'IP_BASED');
    } else if (regFilter === 'NOT_REQUIRED') {
      result = result.filter((t) => t.authMode === 'IP_BASED');
    } else if (regFilter === 'UNREGISTERED') {
      result = result.filter((t) => t.status === 'UNREGISTERED' || t.status === 'UNKNOWN');
    }

    // Trunk Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((t) => (t.trunkType || 'SIP_TRUNK') === typeFilter);
    }

    // Transport filter
    if (transportFilter !== 'ALL') {
      result = result.filter((t) => t.transport === transportFilter);
    }

    // Provider filter
    if (providerFilter !== 'ALL') {
      result = result.filter((t) => t.provider === providerFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'isPrimary') {
        valA = a.isPrimary ? 1 : 0;
        valB = b.isPrimary ? 1 : 0;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? (valA || '').localeCompare(valB || '')
          : (valB || '').localeCompare(valA || '');
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    trunks,
    search,
    statusFilter,
    regFilter,
    typeFilter,
    transportFilter,
    providerFilter,
    sortField,
    sortOrder,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTrunks.length / pageSize) || 1;
  const paginatedTrunks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTrunks.slice(start, start + pageSize);
  }, [filteredTrunks, page, pageSize]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setRegFilter('ALL');
    setTypeFilter('ALL');
    setTransportFilter('ALL');
    setProviderFilter('ALL');
    setPage(1);
  };

  // Toggle Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedTrunks.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Connectivity Test Runner
  const handleRunDiagnostics = async (id: string, name: string) => {
    setDiagData({
      isOpen: true,
      trunkName: name,
      trunkId: id,
      data: null,
      isTesting: true,
    });

    try {
      const res = await api.testTrunk(id);
      setDiagData((prev) => ({
        ...prev,
        data: res,
        isTesting: false,
      }));
      loadTrunks(true);
    } catch (err: any) {
      showToast('Diagnostic probe failed: ' + err.message, 'error');
      setDiagData((prev) => ({
        ...prev,
        data: { rawOutput: 'Probe error: ' + err.message, networkConnected: false },
        isTesting: false,
      }));
    }
  };

  // Push Configuration to Asterisk
  const handlePushConfig = async () => {
    setPushing(true);
    try {
      const res = await api.pushTrunkConfiguration();
      showToast(res.message || 'Configuration pushed to Asterisk telephony core', 'success');
      loadTrunks(true);
    } catch (err: any) {
      showToast('Push failed: ' + err.message, 'error');
    } finally {
      setPushing(false);
    }
  };

  // Toggle Enable/Disable
  const handleToggleEnable = async (trunk: any) => {
    const nextState = !trunk.enabled;
    try {
      await api.updateTrunk(trunk.id, { enabled: nextState });
      showToast(`Trunk "${trunk.name}" ${nextState ? 'enabled' : 'disabled'}`, 'info');
      loadTrunks(true);
    } catch (err: any) {
      showToast('Failed to update trunk state: ' + err.message, 'error');
    }
  };

  // Set as Primary
  const handleSetPrimary = async (trunk: any) => {
    try {
      await api.updateTrunk(trunk.id, { isPrimary: true });
      showToast(`Trunk "${trunk.name}" set as Primary Outbound Route`, 'success');
      loadTrunks(true);
    } catch (err: any) {
      showToast('Failed to set primary trunk: ' + err.message, 'error');
    }
  };

  // Delete Single Trunk
  const handleDeleteSingle = (trunk: any) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete SIP Trunk "${trunk.name}"`,
      message: `Are you sure you want to permanently delete this trunk from Asterisk and database? Inbound and outbound routes assigned to this gateway will be unlinked.`,
      variant: 'danger',
      action: async () => {
        await api.deleteTrunk(trunk.id);
        showToast(`Trunk "${trunk.name}" deleted successfully`, 'success');
        setSelectedIds((prev) => prev.filter((x) => x !== trunk.id));
        loadTrunks(true);
      },
    });
  };

  // Bulk Actions
  const handleBulkAction = (actionType: 'ENABLE' | 'DISABLE' | 'DELETE' | 'ACTIVATE_ALL' | 'DEACTIVATE_ALL') => {
    if (actionType === 'DELETE') {
      setConfirmModal({
        isOpen: true,
        title: `Delete ${selectedIds.length} Selected Trunks`,
        message: `This will permanently remove ${selectedIds.length} SIP trunks and their carrier routes from the PBX. This operation cannot be undone.`,
        variant: 'danger',
        action: async () => {
          await api.bulkActionTrunks('DELETE', selectedIds);
          showToast(`${selectedIds.length} trunks deleted successfully`, 'success');
          setSelectedIds([]);
          loadTrunks(true);
        },
      });
    } else if (actionType === 'ACTIVATE_ALL') {
      setConfirmModal({
        isOpen: true,
        title: 'Activate All SIP Trunks',
        message: 'Are you sure you want to activate and enable all configured SIP trunks across the system?',
        variant: 'primary',
        action: async () => {
          await api.bulkActionTrunks('ACTIVATE_ALL');
          showToast('All SIP trunks activated successfully', 'success');
          loadTrunks(true);
        },
      });
    } else if (actionType === 'DEACTIVATE_ALL') {
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate All SIP Trunks',
        message: 'Warning: Deactivating all trunks will suspend all external inbound and outbound PSTN telephony.',
        variant: 'warning',
        action: async () => {
          await api.bulkActionTrunks('DEACTIVATE_ALL');
          showToast('All SIP trunks deactivated', 'warning');
          loadTrunks(true);
        },
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: `${actionType === 'ENABLE' ? 'Enable' : 'Disable'} Selected Trunks`,
        message: `Apply status change to ${selectedIds.length} selected trunks?`,
        variant: 'primary',
        action: async () => {
          await api.bulkActionTrunks(actionType, selectedIds);
          showToast(`Applied ${actionType.toLowerCase()} to ${selectedIds.length} trunks`, 'success');
          setSelectedIds([]);
          loadTrunks(true);
        },
      });
    }
  };

  // Export JSON
  const handleExportSelected = () => {
    const toExport = selectedIds.length > 0
      ? trunks.filter((t) => selectedIds.includes(t.id))
      : trunks;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `eclypetech_sip_trunks_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${toExport.length} trunk configurations`, 'success');
  };

  // Save Wizard Handler
  const handleSaveWizard = async (trunkData: any) => {
    if (editingTrunk) {
      await api.updateTrunk(editingTrunk.id, trunkData);
    } else {
      await api.createTrunk(trunkData);
    }
    loadTrunks(true);
  };

  // Helper Badge Renderers
  const renderOperationalStatus = (trunk: any) => {
    if (!trunk.enabled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Disabled
        </span>
      );
    }
    if (trunk.status === 'REGISTERED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (trunk.status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Warning
      </span>
    );
  };

  const renderRegistrationStatus = (trunk: any) => {
    if (trunk.authMode === 'IP_BASED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Not Required
        </span>
      );
    }
    if (trunk.status === 'REGISTERED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Registered
        </span>
      );
    }
    if (trunk.status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Registration Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Unregistered
      </span>
    );
  };

  const renderTrunkTypeBadge = (type?: string) => {
    switch (type) {
      case 'GATEWAY':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 inline-flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" /> Gateway
          </span>
        );
      case 'SBC':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200/90 inline-flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" /> SBC
          </span>
        );
      case 'BRIDGE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/90 inline-flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" /> Bridge
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200/90 inline-flex items-center gap-1">
            <Server className="w-2.5 h-2.5" /> SIP Trunk
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              SIP Trunks
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {trunks.length} Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SIP providers, trunk connections, gateways, SBCs, and call routing.
          </p>
        </div>

        {/* Global Quick Action Tooltips & Status Sync */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRefreshing(true);
              loadTrunks();
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300 disabled:opacity-50"
            title="Reload live trunk states"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePushConfig}
            disabled={pushing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300 disabled:opacity-50"
            title="Push live configuration into Asterisk PJSIP core"
          >
            <Send className={`w-3.5 h-3.5 text-blue-600 ${pushing ? 'animate-spin' : ''}`} />
            <span>Push Configuration</span>
          </button>
        </div>
      </div>

      {/* 2. TOP ACTION TOOLBAR */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Primary Action Buttons (Blue Theme) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingTrunk(null);
              setWizardType('SIP_TRUNK');
              setShowWizard(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
            title="Configure a new carrier SIP trunk"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add SIP Trunk</span>
          </button>

          <button
            onClick={() => {
              setEditingTrunk(null);
              setWizardType('GATEWAY');
              setShowWizard(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/90 font-bold text-xs transition"
            title="Connect an on-premises FXO/PSTN voice gateway"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>+ Add Gateway</span>
          </button>

          <button
            onClick={() => {
              setEditingTrunk(null);
              setWizardType('SBC');
              setShowWizard(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/90 font-bold text-xs transition"
            title="Interconnect with a Session Border Controller"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>+ Add SBC</span>
          </button>

          <button
            onClick={() => {
              setEditingTrunk(null);
              setWizardType('BRIDGE');
              setShowWizard(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 font-bold text-xs transition"
            title="Bridge inter-PBX corporate branch routes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>+ Add Bridge</span>
          </button>
        </div>

        {/* Secondary Action Toolbar & Selection Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Edit (enabled only when exactly 1 selected) */}
          <button
            disabled={selectedIds.length !== 1}
            onClick={() => {
              const selected = trunks.find((t) => t.id === selectedIds[0]);
              if (selected) {
                setEditingTrunk(selected);
                setShowWizard(true);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            title={selectedIds.length === 1 ? 'Edit selected trunk' : 'Select exactly 1 trunk to edit'}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Delete (enabled when >= 1 selected) */}
          <button
            disabled={selectedIds.length === 0}
            onClick={() => handleBulkAction('DELETE')}
            className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            title="Delete selected trunks"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete ({selectedIds.length})</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Activate All */}
          <button
            onClick={() => handleBulkAction('ACTIVATE_ALL')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
            title="Enable all trunks"
          >
            <Power className="w-3.5 h-3.5 text-emerald-600" />
            <span>Activate All</span>
          </button>

          {/* Deactivate All */}
          <button
            onClick={() => handleBulkAction('DEACTIVATE_ALL')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
            title="Suspend all external trunks"
          >
            <PowerOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Deactivate All</span>
          </button>

          {/* Import / Export Group */}
          <button
            onClick={() => setShowImport(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
            title="Import provider templates from JSON"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportSelected}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
            title="Export trunks as JSON configuration file"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. SUMMARY DASHBOARD CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Trunks */}
        <div
          onClick={() => {
            setStatusFilter('ALL');
            setRegFilter('ALL');
          }}
          className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ALL' && regFilter === 'ALL'
              ? 'border-sky-500 ring-2 ring-sky-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Trunks
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.total}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Configured interconnects</span>
        </div>

        {/* Active Trunks */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ACTIVE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {metrics.active}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Enabled for live routing</span>
        </div>

        {/* Registered Trunks */}
        <div
          onClick={() => setRegFilter(regFilter === 'REGISTERED' ? 'ALL' : 'REGISTERED')}
          className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-xs ${
            regFilter === 'REGISTERED'
              ? 'border-sky-500 ring-2 ring-sky-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Registered
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-600 tracking-tight">
            {metrics.registered}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Healthy carrier registration</span>
        </div>

        {/* Failed / Offline */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
          className={`p-3.5 bg-white rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'FAILED'
              ? 'border-rose-500 ring-2 ring-rose-500/10'
              : 'border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Failed / Offline
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {metrics.failed}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Needs diagnostic probe</span>
        </div>

        {/* Active Concurrent Calls */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Calls
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 tracking-tight">
            {metrics.activeCalls}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Live carrier sessions</span>
        </div>
      </div>

      {/* 4. SEARCH AND MULTI-FILTER BAR */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs space-y-3">
        {/* Full-width Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by trunk name, provider, hostname, or IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Operational Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Registration Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Registration:</span>
              <select
                value={regFilter}
                onChange={(e) => setRegFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Registration</option>
                <option value="REGISTERED">Registered</option>
                <option value="NOT_REQUIRED">Not Required</option>
                <option value="UNREGISTERED">Unregistered</option>
              </select>
            </div>

            {/* Trunk Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Types</option>
                <option value="SIP_TRUNK">SIP Trunk</option>
                <option value="GATEWAY">Gateway</option>
                <option value="SBC">SBC</option>
                <option value="BRIDGE">Bridge</option>
              </select>
            </div>

            {/* Transport Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Transport:</span>
              <select
                value={transportFilter}
                onChange={(e) => setTransportFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Transports</option>
                <option value="UDP">UDP</option>
                <option value="TCP">TCP</option>
                <option value="TLS">TLS</option>
              </select>
            </div>

            {/* Carrier Provider Filter */}
            {uniqueProviders.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Provider:</span>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Providers</option>
                  {uniqueProviders.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reset Filters Action */}
          <div className="flex items-center gap-2">
            {(search || statusFilter !== 'ALL' || regFilter !== 'ALL' || typeFilter !== 'ALL' || transportFilter !== 'ALL' || providerFilter !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}

            <div className="text-[11px] text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredTrunks.length}</span> results
            </div>
          </div>
        </div>
      </div>

      {/* 5. SIP TRUNKS DATA TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider select-none">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedTrunks.length > 0 && selectedIds.length === paginatedTrunks.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => {
                    setSortField('name');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-800"
                >
                  Trunk Name
                </th>
                <th
                  onClick={() => {
                    setSortField('provider');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-800"
                >
                  Provider
                </th>
                <th className="py-2.5 px-3">Host / IP Address</th>
                <th className="py-2.5 px-3 w-16">Port</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 w-20">Transport</th>
                <th className="py-2.5 px-3 text-center">Max Calls</th>
                <th className="py-2.5 px-3">Registration</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Primary</th>
                <th className="py-2.5 px-3">Last Registered</th>
                <th className="py-2.5 px-3">Last Failure</th>
                <th className="py-2.5 px-3 text-right w-14">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Skeletons when loading
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-3 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-32" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-28" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-10" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-12" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-10 mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-8 mx-auto" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="h-4 bg-slate-200 rounded w-6 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredTrunks.length === 0 ? (
                // Clean Empty State
                <tr>
                  <td colSpan={14} className="py-16 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                        <Server className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">No SIP trunks configured</h3>
                      <p className="text-xs text-slate-500">
                        Connect your PBX to a SIP provider or configure a gateway to enable external inbound and outbound calling.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingTrunk(null);
                            setWizardType('SIP_TRUNK');
                            setShowWizard(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition"
                        >
                          + Add SIP Trunk
                        </button>
                        <button
                          onClick={() => setShowImport(true)}
                          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                        >
                          Import Provider Configuration
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                // Real Data Rows
                paginatedTrunks.map((trunk) => {
                  const isSelected = selectedIds.includes(trunk.id);
                  const isMenuOpen = openMenuId === trunk.id;

                  return (
                    <tr
                      key={trunk.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(trunk.id)}
                          className="w-4 h-4 rounded text-sky-600 accent-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>

                      {/* Trunk Name */}
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setDetailsTrunk(trunk);
                              setShowDetails(true);
                            }}
                            className="hover:text-sky-600 hover:underline transition text-left cursor-pointer"
                          >
                            {trunk.name}
                          </button>
                          {trunk.isPrimary && (
                            <span className="p-0.5 rounded text-amber-500" title="Primary Outbound Trunk">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            </span>
                          )}
                        </div>
                        {trunk.description && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {trunk.description}
                          </div>
                        )}
                      </td>

                      {/* Provider */}
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {trunk.provider}
                      </td>

                      {/* Host / IP */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 text-[11px]">
                        {trunk.serverAddress}
                      </td>

                      {/* Port */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {trunk.serverPort || 5060}
                      </td>

                      {/* Trunk Type */}
                      <td className="py-2.5 px-3">
                        {renderTrunkTypeBadge(trunk.trunkType)}
                      </td>

                      {/* Transport */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px]">
                        {trunk.transport}
                      </td>

                      {/* Max Calls */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 text-center font-bold">
                        <span className="text-slate-900">{trunk.activeCalls || 0}</span>
                        <span className="text-slate-400 font-normal"> / {trunk.maxConcurrent}</span>
                      </td>

                      {/* Registration Status */}
                      <td className="py-2.5 px-3">
                        {renderRegistrationStatus(trunk)}
                      </td>

                      {/* Operational Status */}
                      <td className="py-2.5 px-3">
                        {renderOperationalStatus(trunk)}
                      </td>

                      {/* Primary Trunk Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {trunk.isPrimary ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>

                      {/* Last Registration Attempt */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {trunk.lastRegisteredAt
                          ? new Date(trunk.lastRegisteredAt).toLocaleTimeString()
                          : trunk.authMode === 'IP_BASED'
                          ? 'Not Required'
                          : 'Pending'}
                      </td>

                      {/* Last Failure */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                        {trunk.lastError ? (
                          <span className="text-rose-600 truncate block" title={trunk.lastError}>
                            {trunk.lastError.slice(0, 18)}...
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-2.5 px-3 text-right relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : trunk.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Actions menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Three-Dot Popover Menu */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-8 z-30 w-52 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 text-left text-xs animate-in fade-in duration-100 divide-y divide-slate-100"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setDetailsTrunk(trunk);
                                  setShowDetails(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-600" />
                                <span>View Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingTrunk(trunk);
                                  setShowWizard(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                <span>Edit Trunk</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleToggleEnable(trunk);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                {trunk.enabled ? (
                                  <>
                                    <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Disable Trunk</span>
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Enable Trunk</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleRunDiagnostics(trunk.id, trunk.name);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Activity className="w-3.5 h-3.5 text-sky-600" />
                                <span>Test Connectivity</span>
                              </button>

                              {!trunk.isPrimary && (
                                <button
                                  onClick={() => {
                                    handleSetPrimary(trunk);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Set as Primary</span>
                                </button>
                              )}
                            </div>

                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleDeleteSingle(trunk);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete Trunk</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6. PAGINATION FOOTER */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/40">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-slate-400">
              Showing {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, filteredTrunks.length)} of {filteredTrunks.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-STEP ADD / EDIT TRUNK WIZARD */}
      <TrunkWizardModal
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false);
          setEditingTrunk(null);
        }}
        initialType={wizardType}
        editingTrunk={editingTrunk}
        onSave={handleSaveWizard}
      />

      {/* TRUNK DETAILS SLIDE-OVER DRAWER */}
      <TrunkDetailsDrawer
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setDetailsTrunk(null);
        }}
        trunk={detailsTrunk}
        onTestConnectivity={handleRunDiagnostics}
        onEdit={(t) => {
          setShowDetails(false);
          setEditingTrunk(t);
          setShowWizard(true);
        }}
      />

      {/* LIVE DIAGNOSTICS PROBE MODAL */}
      <TrunkDiagnosticsModal
        isOpen={diagData.isOpen}
        onClose={() => setDiagData((prev) => ({ ...prev, isOpen: false }))}
        trunkName={diagData.trunkName}
        data={diagData.data}
        isRetesting={diagData.isTesting}
        onRetest={() => handleRunDiagnostics(diagData.trunkId, diagData.trunkName)}
      />

      {/* IMPORT PROVIDERS MODAL */}
      <ImportProvidersModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={async (items) => {
          for (const item of items) {
            await api.createTrunk(item);
          }
          loadTrunks(true);
        }}
      />

      {/* CONFIRMATION DIALOG (BULK & DELETION) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={confirmLoading}
        onConfirm={async () => {
          setConfirmLoading(true);
          try {
            await confirmModal.action();
          } finally {
            setConfirmLoading(false);
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
