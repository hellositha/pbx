'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  FolderLock,
  Plus,
  Trash2,
  Edit2,
  Shield,
  User,
  Building,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Key,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Users2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  createdAt: string;
}

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    users?: number;
    extensions?: number;
  };
}

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'USERS' | 'DEPARTMENTS'>('USERS');
  const [search, setSearch] = useState('');

  // Delete Confirm Modal State
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'USER' | 'DEPARTMENT';
    id: string;
    name: string;
  } | null>(null);

  // User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'STANDARD_USER',
    departmentId: '',
  });

  // Department Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, dData] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(uData.users || []);
      setDepartments(dData.departments || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load personnel data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateUser = () => {
    setUserForm({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'STANDARD_USER',
      departmentId: departments[0]?.id || '',
    });
    setShowPassword(false);
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    try {
      await api.createUser(userForm);
      showToast(`User account @${userForm.username} created successfully`, 'success');
      setShowUserModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDept(true);
    try {
      await api.createDepartment(deptForm);
      showToast(`Department "${deptForm.name}" created`, 'success');
      setShowDeptModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create department', 'error');
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!pendingDelete) return;
    const { type, id, name } = pendingDelete;
    setPendingDelete(null);

    if (type === 'USER') {
      try {
        await api.deleteUser(id);
        showToast(`User @${name} deleted successfully`, 'success');
        await loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete user', 'error');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      (u.department?.name || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Super Administrator
          </span>
        );
      case 'PBX_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            PBX Administrator
          </span>
        );
      case 'DEPARTMENT_MANAGER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Dept Manager
          </span>
        );
      case 'SUPERVISOR':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Call Supervisor
          </span>
        );
      case 'RECEPTIONIST':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Receptionist
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Standard User
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Access Control & Personnel Directory
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
              {users.length} Users • {departments.length} Depts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC), administrative credentials, and departmental structure
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition hover:border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {tab === 'USERS' ? (
            <button
              onClick={handleOpenCreateUser}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create User Account</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setDeptForm({ name: '', code: '', description: '' });
                setShowDeptModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Accounts</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{users.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
            <Users2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Active Users</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {users.filter((u) => u.isActive).length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Administrators</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">
              {users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'PBX_ADMIN').length}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Departments</div>
            <div className="text-xl font-bold text-slate-700 mt-0.5">{departments.length}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Building className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-lg">
          <button
            onClick={() => setTab('USERS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'USERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Personnel Accounts ({users.length})</span>
          </button>
          <button
            onClick={() => setTab('DEPARTMENTS')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
              tab === 'DEPARTMENTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-sky-600" />
            <span>Departments ({departments.length})</span>
          </button>
        </div>

        {tab === 'USERS' && (
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
            />
          </div>
        )}
      </div>

      {/* Tab Content: USERS */}
      {tab === 'USERS' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">User</th>
                  <th className="py-2.5 px-3.5">Email</th>
                  <th className="py-2.5 px-3.5">RBAC Role</th>
                  <th className="py-2.5 px-3.5">Department</th>
                  <th className="py-2.5 px-3.5">Account Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Loading personnel accounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-800 text-sm">No user accounts found</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        {search
                          ? `No users matching "${search}". Try a different keyword.`
                          : 'Click "Create User Account" to add your first PBX user.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">@{u.username}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-2.5 px-3.5">{getRoleBadge(u.role)}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">
                        {u.department ? (
                          <span className="font-medium text-slate-800">{u.department.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.isActive ? 'ACTIVE' : 'LOCKED'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {u.role !== 'SUPER_ADMIN' ? (
                          <button
                            onClick={() =>
                              setPendingDelete({
                                type: 'USER',
                                id: u.id,
                                name: u.username,
                              })
                            }
                            className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-lg transition shadow-2xs"
                            title={`Delete user @${u.username}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span
                            className="text-[10px] text-slate-400 font-medium italic"
                            title="Super Admin cannot be deleted"
                          >
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: DEPARTMENTS */}
      {tab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200/90 rounded-xl p-12 text-center text-slate-400 shadow-xs">
              <Building className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-800 text-sm">No departments created yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Click "Add Department" to group users and extensions into organizational units.
              </p>
            </div>
          ) : (
            departments.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{d.name}</h3>
                        <span className="font-mono text-[10px] text-sky-700 font-bold bg-sky-50 border border-sky-200/60 px-1.5 py-0.2 rounded">
                          {d.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    {d.description || 'Department organizational unit'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d._count?.users || 0} Members</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <Users2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>{d._count?.extensions || 0} Extensions</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Create Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-sky-600" />
                <span>Create Personnel User Account</span>
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jdoe"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jdoe@company.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-sky-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Access Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="SUPER_ADMIN">Super Administrator</option>
                    <option value="PBX_ADMIN">PBX Administrator</option>
                    <option value="DEPARTMENT_MANAGER">Department Manager</option>
                    <option value="SUPERVISOR">Call Supervisor</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="STANDARD_USER">Standard User</option>
                    <option value="AUDITOR">Auditor (Read-Only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-semibold block mb-1">Department</label>
                  <select
                    value={userForm.departmentId}
                    onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                    className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="">None (Unassigned)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  disabled={isSubmittingUser}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition flex items-center gap-1.5 active:scale-95"
                >
                  {isSubmittingUser && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-600" />
                <span>Add Department</span>
              </h2>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Support"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUP"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-sky-500 transition"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Customer support and helpdesk"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  disabled={isSubmittingDept}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDept}
                  className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs shadow-sky-600/20 transition flex items-center gap-1.5 active:scale-95"
                >
                  {isSubmittingDept && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Create Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={!!pendingDelete}
        title={`Delete User @${pendingDelete?.name}`}
        message={`Are you sure you want to permanently delete user account "${pendingDelete?.name}"? Any linked PBX extensions will be unassigned.`}
        confirmText="Delete Account"
        confirmVariant="danger"
        onConfirm={handleExecuteDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
