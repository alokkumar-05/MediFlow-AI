import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Eye,
  Check,
  Ban,
  FileText
} from 'lucide-react';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Modal actions state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const fetchFiltersData = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([
        api.get('/departments'),
        api.get('/public/doctors')
      ]);
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.departments || []);
      }
      if (docRes.data?.success) {
        setDoctors(docRes.data.doctors || []);
      }
    } catch (err) {
      console.error('Error fetching filter lists:', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (doctorFilter) params.append('doctor', doctorFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await api.get(`/admin/appointments?${params.toString()}`);
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching admin appointments:', err);
      setError(err.response?.data?.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, departmentFilter, doctorFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments();
  };

  const openReassignModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNewDoctorId(appointment.doctor?._id || '');
    setActionError('');
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctorId || newDoctorId === selectedAppointment.doctor?._id) {
      setActionError('Please select a different physician to reassign.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const res = await api.patch(`/admin/appointments/${selectedAppointment._id}/assign-doctor`, {
        newDoctorId
      });
      if (res.data?.success) {
        setSuccessMessage('Physician reassigned successfully.');
        setShowReassignModal(false);
        fetchAppointments();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reassign doctor.');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (appointment, presetStatus = '') => {
    setSelectedAppointment(appointment);
    setNewStatus(presetStatus || appointment.status);
    setStatusNotes(appointment.notes || '');
    setCancellationReason('');
    setActionError('');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      setActionError('Please select a valid status.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const res = await api.patch(`/admin/appointments/${selectedAppointment._id}/status`, {
        status: newStatus,
        notes: statusNotes,
        cancellationReason: newStatus === 'cancelled' ? cancellationReason : undefined
      });
      if (res.data?.success) {
        setSuccessMessage(`Appointment status updated to ${newStatus}.`);
        setShowStatusModal(false);
        fetchAppointments();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completed: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
      no_show: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Master Appointments"
        subtitle="Global outpatient schedule monitor, physician reassignment, and status audit"
      />

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by patient, doctor, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </form>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
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

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Found {appointments.length} appointments</span>
          {(searchQuery || statusFilter || departmentFilter || doctorFilter || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setDepartmentFilter('');
                setDoctorFilter('');
                setDateFilter('');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </Card>

      {/* Appointment Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading appointment roster...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No appointments found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Adjust your search filters or wait for patients to schedule outpatient consultations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Schedule</th>
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">Physician & Dept</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{appt.appointmentDate}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{appt.startTime} – {appt.endTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{appt.patient?.name || 'Unknown Patient'}</div>
                      <div className="text-xs text-slate-500">{appt.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                        <span>Dr. {appt.doctor?.user?.name || 'Unassigned'}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{appt.department?.name || 'General OPD'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-slate-700 text-xs">{appt.reason}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appt.status)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setShowDetailModal(true);
                          }}
                          title="View Details"
                          className="p-1.5 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
                          <>
                            <button
                              onClick={() => openReassignModal(appt)}
                              title="Reassign Physician"
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(appt)}
                              title="Update Status"
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Check className="w-4 h-4" />
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

      {/* Details Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Appointment Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs text-slate-500 block">Date</span>
                  <span className="font-semibold text-slate-800">{selectedAppointment.appointmentDate}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Time Slot</span>
                  <span className="font-semibold text-slate-800">{selectedAppointment.startTime} – {selectedAppointment.endTime}</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-slate-500 block">Status</span>
                  <div>{getStatusBadge(selectedAppointment.status)}</div>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-slate-500 block">Department</span>
                  <span className="font-medium text-slate-800">{selectedAppointment.department?.name || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Patient Information</span>
                <p className="font-medium text-slate-900">{selectedAppointment.patient?.name}</p>
                <p className="text-xs text-slate-500">{selectedAppointment.patient?.email}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Attending Physician</span>
                <p className="font-medium text-slate-900">Dr. {selectedAppointment.doctor?.user?.name}</p>
                <p className="text-xs text-slate-500">{selectedAppointment.doctor?.specialization}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Reason for Visit</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs mt-1">
                  {selectedAppointment.reason || 'None specified.'}
                </p>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">Clinical / Administrative Notes</span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs mt-1">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {selectedAppointment.status === 'cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-xs">
                  <span className="font-semibold block">Cancellation Record:</span>
                  <p className="mt-0.5">{selectedAppointment.cancellationReason || 'No reason provided.'}</p>
                  {selectedAppointment.cancelledBy && (
                    <p className="text-rose-600 mt-1 text-[11px]">
                      Cancelled by: {selectedAppointment.cancelledBy.name} ({selectedAppointment.cancelledBy.role})
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Doctor Modal */}
      {showReassignModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                Reassign Physician
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedAppointment.patient?.name}</div>
                <div><strong>Schedule:</strong> {selectedAppointment.appointmentDate} ({selectedAppointment.startTime} – {selectedAppointment.endTime})</div>
                <div><strong>Current Doctor:</strong> Dr. {selectedAppointment.doctor?.user?.name}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Attending Physician *
                </label>
                <select
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.user?.name} ({doc.specialization} - {doc.department?.name})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  The system will automatically verify schedule availability and reject conflicts.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowReassignModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Reassigning...' : 'Confirm Reassignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Update Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              {newStatus === 'cancelled' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cancellation Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Provide reason for cancellation..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Additional status remarks..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
