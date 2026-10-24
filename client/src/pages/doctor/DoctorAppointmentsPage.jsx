import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  UserX,
  FileText,
  Filter
} from 'lucide-react';

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  no_show: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [completingAppt, setCompletingAppt] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/doctor/appointments?${params.toString()}`);
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterDate, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments();
  };

  // Confirm appointment
  const handleConfirm = async (id) => {
    try {
      const res = await api.patch(`/doctor/appointments/${id}/confirm`);
      if (res.data?.success) {
        setSuccessMessage('Appointment confirmed.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm appointment.');
    }
  };

  // Mark No-Show
  const handleNoShow = async (id) => {
    try {
      const res = await api.patch(`/doctor/appointments/${id}/no-show`);
      if (res.data?.success) {
        setSuccessMessage('Appointment marked as No-Show.');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Complete consultation with notes
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingAppt) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/doctor/appointments/${completingAppt._id}/complete`, {
        notes: clinicalNotes,
      });
      if (res.data?.success) {
        setSuccessMessage('Consultation marked as Completed.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setCompletingAppt(null);
        setClinicalNotes('');
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel consultation
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/doctor/appointments/${cancellingAppt._id}/cancel`, {
        cancellationReason: cancelReason,
      });
      if (res.data?.success) {
        setSuccessMessage('Appointment cancelled.');
        setTimeout(() => setSuccessMessage(''), 3000);
        setCancellingAppt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Counters
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Physician Appointment Schedule"
        subtitle="Manage outpatient consultation queue, confirm bookings, and record visit outcomes"
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAppointments}>
            Refresh Schedule
          </Button>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Queue Total</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{appointments.length}</div>
        </div>
        <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending Action</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Confirmed</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{confirmedCount}</div>
        </div>
        <div className="p-4 bg-white border border-blue-200 rounded-2xl shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Completed</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name, email, or symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700"
              />
              <button
                type="button"
                onClick={() => setFilterDate(todayStr)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border ${
                  filterDate === todayStr
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border ${
                  filterDate === ''
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Dates
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="no_show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Appointments Queue Table */}
      <Card
        title="Consultation Roster Queue"
        subtitle={filterDate ? `Scheduled patients for ${filterDate}` : 'All scheduled patient consultations'}
      >
        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading consultation schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Patients in Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are no outpatient bookings matching the selected date or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Time & Date</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Chief Complaint / Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  return (
                    <tr key={appt._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {appt.startTime} - {appt.endTime}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 ml-5">
                          {appt.appointmentDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                            {appt.patient?.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div>{appt.patient?.name}</div>
                            <div className="text-[10px] font-normal text-slate-400">{appt.patient?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-800 font-medium truncate" title={appt.reason}>
                          {appt.reason}
                        </div>
                        {appt.notes && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            Note: {appt.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            STATUS_BADGES[appt.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {appt.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {appt.status === 'pending' && (
                            <button
                              onClick={() => handleConfirm(appt._id)}
                              title="Confirm Booking"
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirm
                            </button>
                          )}

                          {appt.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => {
                                  setCompletingAppt(appt);
                                  setClinicalNotes('');
                                }}
                                title="Complete Visit"
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Complete
                              </button>
                              <button
                                onClick={() => handleNoShow(appt._id)}
                                title="Mark as No-Show"
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {['pending', 'confirmed'].includes(appt.status) && (
                            <button
                              onClick={() => {
                                setCancellingAppt(appt);
                                setCancelReason('');
                              }}
                              title="Cancel Consultation"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedAppt(appt)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* COMPLETE CONSULTATION MODAL */}
      {completingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Complete Consultation: {completingAppt.patient?.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mark this outpatient encounter as finished. You can enter summary observations or clinical instructions.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Physician Consultation Notes & Summary
                </label>
                <textarea
                  rows="4"
                  placeholder="Clinical assessment summary, patient recommendations, advised diet, follow-up period..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletingAppt(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                >
                  Confirm Visit Completed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cancel Consultation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Cancel scheduled visit with{' '}
              <span className="font-semibold text-slate-800">{cancellingAppt.patient?.name}</span>?
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Physician called for emergency surgical procedure, rescheduled..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingAppt(null)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={actionLoading}
                >
                  Cancel Consultation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Encounter Details</h3>
              <button
                onClick={() => setSelectedAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-800">{selectedAppt.patient?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-700">{selectedAppt.patient?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAppt.appointmentDate} ({selectedAppt.startTime} - {selectedAppt.endTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                      STATUS_BADGES[selectedAppt.status]
                    }`}
                  >
                    {selectedAppt.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Reported Reason:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 leading-relaxed">
                  {selectedAppt.reason}
                </p>
              </div>

              {selectedAppt.notes && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Clinical Notes:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 leading-relaxed">
                    {selectedAppt.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedAppt(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
