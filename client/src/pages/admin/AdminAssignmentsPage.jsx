import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  BedDouble,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Eye,
  Edit2,
  Calendar,
  Building2,
  Stethoscope,
  User,
  Activity
} from 'lucide-react';

export default function AdminAssignmentsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [metrics, setMetrics] = useState({ activeCount: 0, dischargedCount: 0 });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Create admission form
  const [newPatientId, setNewPatientId] = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [newBedNumber, setNewBedNumber] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Discharge form
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [treatmentSummary, setTreatmentSummary] = useState('');

  // Edit Bed form
  const [editBedNumber, setEditBedNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchDropdownData = async () => {
    try {
      const [usersRes, docsRes, deptsRes] = await Promise.all([
        api.get('/admin/users?role=patient'),
        api.get('/public/doctors'),
        api.get('/departments')
      ]);

      if (usersRes.data?.success) {
        setPatients(usersRes.data.users || []);
      }
      if (docsRes.data?.success) {
        setDoctors(docsRes.data.doctors || []);
      }
      if (deptsRes.data?.success) {
        setDepartments(deptsRes.data.departments || []);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const [admRes, metRes] = await Promise.all([
        api.get(`/admin/admissions?${params.toString()}`),
        api.get('/admin/admissions/metrics')
      ]);

      if (admRes.data?.success) {
        setAdmissions(admRes.data.admissions || []);
      }
      if (metRes.data?.success) {
        setMetrics(metRes.data.metrics || { activeCount: 0, dischargedCount: 0 });
      }
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setError(err.response?.data?.message || 'Failed to load hospital admissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, departmentFilter]);

  const handleCreateAdmission = async (e) => {
    e.preventDefault();
    if (!newPatientId || !newDoctorId || !newDepartmentId || !newBedNumber.trim() || !newReason.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        patientId: newPatientId,
        doctorId: newDoctorId,
        departmentId: newDepartmentId,
        bedNumber: newBedNumber.trim(),
        admissionReason: newReason.trim(),
        notes: newNotes.trim()
      };

      const res = await api.post('/admin/admissions', payload);
      if (res.data?.success) {
        setSuccessMessage('Patient admitted successfully.');
        setShowCreateModal(false);
        // Reset form
        setNewPatientId('');
        setNewDoctorId('');
        setNewDepartmentId('');
        setNewBedNumber('');
        setNewReason('');
        setNewNotes('');
        fetchAdmissions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create admission.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    if (!dischargeSummary.trim()) {
      setFormError('Discharge clinical summary is required.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.patch(`/admin/admissions/${selectedAdmission._id}/discharge`, {
        dischargeSummary: dischargeSummary.trim(),
        treatmentSummary: treatmentSummary.trim()
      });

      if (res.data?.success) {
        setSuccessMessage('Patient discharged successfully.');
        setShowDischargeModal(false);
        setDischargeSummary('');
        setTreatmentSummary('');
        fetchAdmissions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to discharge patient.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditBedSubmit = async (e) => {
    e.preventDefault();
    if (!editBedNumber.trim()) {
      setFormError('Bed identifier cannot be empty.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.patch(`/admin/admissions/${selectedAdmission._id}`, {
        bedNumber: editBedNumber.trim(),
        notes: editNotes.trim()
      });

      if (res.data?.success) {
        setSuccessMessage('Bed allocation updated successfully.');
        setShowEditModal(false);
        fetchAdmissions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update admission details.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inpatient Admissions & Bed Allocation"
        subtitle="Manage hospital bed assignments, inpatient caseload, and clinical discharge summaries"
        action={
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => {
              setFormError('');
              setShowCreateModal(true);
            }}
          >
            Admit Patient
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Currently Admitted</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeCount}</p>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                Inpatient Wards
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BedDouble className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Discharges</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.dischargedCount}</p>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                Completed Care
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Available Doctors</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{doctors.length}</p>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                On Duty
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Clinical Units</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{departments.length}</p>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                Departments
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by bed number or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAdmissions()}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="admitted">Currently Admitted</option>
              <option value="discharged">Discharged</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Admissions Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading inpatient admissions...</p>
          </div>
        ) : admissions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <BedDouble className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No admission records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Admit a patient to track their room assignment and inpatient care.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Bed / Room</th>
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">Attending Doctor</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Admission Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                        {adm.bedNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{adm.patient?.name}</div>
                      <div className="text-xs text-slate-500">{adm.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">Dr. {adm.attendingDoctor?.user?.name}</div>
                      <div className="text-xs text-slate-500">{adm.attendingDoctor?.specialization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-slate-700">{adm.department?.name || 'General Ward'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {new Date(adm.admissionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                        adm.status === 'admitted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : adm.status === 'discharged'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {adm.status ? adm.status.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAdmission(adm);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {adm.status === 'admitted' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setEditBedNumber(adm.bedNumber);
                                setEditNotes(adm.notes || '');
                                setFormError('');
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="Reallocate Bed"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setDischargeSummary('');
                                setTreatmentSummary('');
                                setFormError('');
                                setShowDischargeModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Discharge Patient"
                            >
                              <LogOut className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Admit Patient Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-primary-600" />
                Admit Inpatient
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmission} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Registered Patient *
                </label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attending Physician *
                  </label>
                  <select
                    value={newDoctorId}
                    onChange={(e) => setNewDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    required
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.user?.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    required
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((dep) => (
                      <option key={dep._id} value={dep._id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bed / Room Identifier *
                </label>
                <input
                  type="text"
                  placeholder="e.g., ICU-04, Ward-2A-Bed12"
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission Reason / Admitting Diagnosis *
                </label>
                <textarea
                  rows={2}
                  placeholder="Clinical reason for hospital admission..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Inpatient Care Directives
                </label>
                <textarea
                  rows={2}
                  placeholder="Initial nursing care instructions, dietary precautions..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Admitting...' : 'Confirm Admission'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Patient Modal */}
      {showDischargeModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-600" />
                Discharge Patient
              </h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleDischargeSubmit} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedAdmission.patient?.name}</div>
                <div><strong>Bed:</strong> {selectedAdmission.bedNumber}</div>
                <div><strong>Admitted On:</strong> {new Date(selectedAdmission.admissionDate).toLocaleDateString()}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discharge Clinical Summary *
                </label>
                <textarea
                  rows={3}
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  placeholder="Recovery outcome, post-discharge instructions, and follow-up directives..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Treatment Summary & Medication Discontinuation
                </label>
                <textarea
                  rows={2}
                  value={treatmentSummary}
                  onChange={(e) => setTreatmentSummary(e.target.value)}
                  placeholder="Summary of inpatient therapies and discontinued meds..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowDischargeModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Discharging...' : 'Finalize Discharge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bed Allocation Modal */}
      {showEditModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                Reallocate Bed / Room
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditBedSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Bed / Room Identifier *
                </label>
                <input
                  type="text"
                  value={editBedNumber}
                  onChange={(e) => setEditBedNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transfer Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Reason for room/bed transfer..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Update Bed'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Admission Chart Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedAdmission.patient?.name} ({selectedAdmission.patient?.email})</div>
                <div><strong>Bed:</strong> {selectedAdmission.bedNumber}</div>
                <div><strong>Department:</strong> {selectedAdmission.department?.name}</div>
                <div><strong>Attending Doctor:</strong> Dr. {selectedAdmission.attendingDoctor?.user?.name}</div>
                <div><strong>Admitted Date:</strong> {new Date(selectedAdmission.admissionDate).toLocaleString()}</div>
                <div><strong>Status:</strong> <span className="uppercase font-semibold">{selectedAdmission.status}</span></div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Admission Reason:</span>
                <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {selectedAdmission.admissionReason}
                </p>
              </div>

              {selectedAdmission.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">Care Notes:</span>
                  <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedAdmission.notes}
                  </p>
                </div>
              )}

              {selectedAdmission.status === 'discharged' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900">Discharge Information</div>
                  <div><strong>Discharge Date:</strong> {new Date(selectedAdmission.dischargeDate).toLocaleString()}</div>
                  {selectedAdmission.dischargedBy && (
                    <div><strong>Discharged By:</strong> {selectedAdmission.dischargedBy.name}</div>
                  )}
                  <div>
                    <strong>Summary:</strong>
                    <p className="mt-1 text-slate-700 bg-white/70 p-2 rounded">{selectedAdmission.dischargeSummary}</p>
                  </div>
                  {selectedAdmission.treatmentSummary && (
                    <div>
                      <strong>Treatment Course:</strong>
                      <p className="mt-1 text-slate-700 bg-white/70 p-2 rounded">{selectedAdmission.treatmentSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
