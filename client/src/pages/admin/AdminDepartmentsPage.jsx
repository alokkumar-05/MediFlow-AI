import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Edit2,
  MapPin,
  Stethoscope,
  Power,
  FileText
} from 'lucide-react';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' (all), 'true' (active), 'false' (deactivated)

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    location: '',
    headDoctor: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Departments
  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/admin/departments';
      const params = new URLSearchParams();
      if (statusFilter !== '') {
        params.append('isActive', statusFilter);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch departments from the server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Doctors for the Head Doctor selector
  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/staff?role=doctor');
      if (res.data?.success) {
        setDoctors(res.data.staff || []);
      }
    } catch (err) {
      // Non-critical if doctors cannot be loaded
      console.warn('Could not load doctors list for department head assignment:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      location: 'Main Hospital Building',
      headDoctor: '',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      location: dept.location || '',
      headDoctor: dept.headDoctor?._id || dept.headDoctor || '',
    });
    setFormError('');
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        description: formData.description.trim(),
        location: formData.location.trim() || 'Main Hospital Building',
        headDoctor: formData.headDoctor || undefined,
      };

      const res = await api.post('/admin/departments', payload);
      if (res.data?.success) {
        setSuccessMessage(`Department '${res.data.department.name}' created successfully.`);
        setShowCreateModal(false);
        fetchDepartments();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    setFormError('');
    setFormLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || undefined,
        description: formData.description.trim(),
        location: formData.location.trim(),
        headDoctor: formData.headDoctor || null,
      };

      const res = await api.put(`/admin/departments/${editingDept._id}`, payload);
      if (res.data?.success) {
        setSuccessMessage(`Department '${res.data.department.name}' updated successfully.`);
        setEditingDept(null);
        fetchDepartments();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update department.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      const res = await api.patch(`/admin/departments/${dept._id}/status`);
      if (res.data?.success) {
        setSuccessMessage(res.data.message);
        fetchDepartments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update department status.');
    }
  };

  // Client-side search filtering
  const filteredDepartments = departments.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.location && d.location.toLowerCase().includes(q)) ||
      (d.headDoctor?.name && d.headDoctor.name.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <PageHeader
        title="Department Management"
        subtitle="Configure hospital specialty divisions, unit codes, locations, and clinical leadership"
        action={
          <Button icon={Plus} variant="primary" onClick={openCreateModal}>
            Add Department
          </Button>
        }
      />

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDepartments}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments by name, code, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchDepartments}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Department Cards Grid */}
      <Card 
        title="Hospital Specialty Divisions" 
        subtitle={`Showing ${filteredDepartments.length} registered department${filteredDepartments.length === 1 ? '' : 's'}`}
      >
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <span>Loading hospital departments...</span>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No departments found</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Create hospital specialty divisions to assign doctors and schedule appointments.'}
            </p>
            {!searchQuery && (
              <Button icon={Plus} variant="primary" size="sm" className="mt-4" onClick={openCreateModal}>
                Create Department
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDepartments.map((dept) => (
              <div 
                key={dept._id} 
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  dept.isActive 
                    ? 'bg-white border-slate-200/90 hover:border-blue-300 shadow-xs' 
                    : 'bg-slate-50/70 border-slate-200/50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {dept.code || 'DEPT'}
                    </span>
                    <span 
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        dept.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {dept.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
                  
                  {dept.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {dept.description}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{dept.location || 'Main Hospital Building'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {dept.headDoctor?.name ? `Head: ${dept.headDoctor.name}` : 'Head: Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Edit department"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(dept)}
                    className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      dept.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={dept.isActive ? 'Deactivate department' : 'Reactivate department'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{dept.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold">Add Hospital Department</h3>
            </div>
            <p className="text-xs text-slate-500">
              Create a specialty division to roster doctors and schedule outpatient appointments.
            </p>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology, Orthopedics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Code (Optional, max 10 chars)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. CARD, ORTH (auto-generated if blank)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full text-xs uppercase font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Building A, Floor 2, East Wing"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head of Department (Physician)
                </label>
                <select
                  value={formData.headDoctor}
                  onChange={(e) => setFormData({ ...formData, headDoctor: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value="">-- No Head Doctor Assigned --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} ({doc.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Clinical scope, inpatient services, or focus areas..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formLoading}
                >
                  {formLoading ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 mb-1">
              <Edit2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold">Edit Department Details</h3>
            </div>
            <p className="text-xs text-slate-500">
              Update division name, location, clinical description, or leadership.
            </p>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateDepartment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Code
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full text-xs uppercase font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campus Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head of Department (Physician)
                </label>
                <select
                  value={formData.headDoctor}
                  onChange={(e) => setFormData({ ...formData, headDoctor: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value="">-- No Head Doctor Assigned --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} ({doc.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setEditingDept(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
