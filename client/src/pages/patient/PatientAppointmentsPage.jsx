import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Building2,
  Stethoscope,
  XCircle,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Info
} from 'lucide-react';

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  no_show: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Rescheduling Modal
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/patient/appointments';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const res = await api.get(url);
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  // Load available slots when rescheduling modal is open and date changes
  useEffect(() => {
    if (!reschedulingAppt || !newDate) return;
    const doctorId = reschedulingAppt.doctor?._id || reschedulingAppt.doctor;
    if (!doctorId) return;

    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const res = await api.get(`/appointments/available-slots?doctorId=${doctorId}&date=${newDate}`);
        if (res.data?.success) {
          setAvailableSlots(res.data.slots || []);
        }
      } catch (err) {
        console.error('Failed to load slots for rescheduling', err);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [reschedulingAppt, newDate]);

  // Cancel Appointment handler
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    setCancelLoading(true);
    try {
      const res = await api.patch(`/patient/appointments/${cancellingAppt._id}/cancel`, {
        cancellationReason: cancelReason,
      });
      if (res.data?.success) {
        setSuccessMessage('Appointment cancelled successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setCancellingAppt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Reschedule Appointment handler
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingAppt || !selectedSlot) return;
    setRescheduleLoading(true);
    try {
      const res = await api.post(`/patient/appointments/${reschedulingAppt._id}/reschedule`, {
        newDate,
        newStartTime: selectedSlot.startTime,
        reason: reschedulingAppt.reason,
      });
      if (res.data?.success) {
        setSuccessMessage('Appointment rescheduled successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setReschedulingAppt(null);
        setSelectedSlot(null);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule appointment.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Appointments"
        subtitle="View upcoming consultations, status updates, and manage bookings"
        action={
          <Link to="/patient/book-appointment">
            <Button icon={CalendarPlus} variant="primary" size="sm">
              Book Consultation
            </Button>
          </Link>
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

      {/* Filter Toolbar */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAppointments}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Appointments List */}
      <Card
        title={`Consultation Appointments (${appointments.length})`}
        subtitle="Your past and scheduled medical outpatient consultations"
      >
        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Appointments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {statusFilter
                ? 'No appointments found with this status filter.'
                : 'You have not scheduled any outpatient consultations yet.'}
            </p>
            <Link to="/patient/book-appointment">
              <Button icon={CalendarPlus} size="sm">
                Book Outpatient Visit
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Doctor & Department</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Fee / Room</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const docUser = appt.doctor?.user;
                  const canCancel = ['pending', 'confirmed'].includes(appt.status);
                  const canReschedule = ['pending', 'confirmed'].includes(appt.status);

                  return (
                    <tr key={appt._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {appt.appointmentDate}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 ml-5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {appt.startTime} - {appt.endTime}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {docUser?.name || 'Assigned Physician'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {appt.department?.name || 'Department'}
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
                        <div className="font-semibold text-slate-800">
                          ₹{appt.doctor?.consultationFee || 500}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {appt.doctor?.roomNumber || 'Consultation Suite'}
                        </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAppt(appt)}
                            className="py-1 px-2 text-[11px]"
                          >
                            Details
                          </Button>
                          {canReschedule && (
                            <button
                              onClick={() => setReschedulingAppt(appt)}
                              title="Reschedule Appointment"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => setCancellingAppt(appt)}
                              title="Cancel Appointment"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
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

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Appointment Slip</h3>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
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
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAppt.appointmentDate} ({selectedAppt.startTime} - {selectedAppt.endTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAppt.doctor?.user?.name || 'Physician'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specialty & Dept:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAppt.doctor?.specialization} • {selectedAppt.department?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room / Cabin:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAppt.doctor?.roomNumber || 'Consultation Suite'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consultation Fee:</span>
                  <span className="font-bold text-blue-700">₹{selectedAppt.doctor?.consultationFee || 500}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Chief Reason:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 leading-relaxed">
                  {selectedAppt.reason}
                </p>
              </div>

              {selectedAppt.notes && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Notes:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-800 leading-relaxed">
                    {selectedAppt.notes}
                  </p>
                </div>
              )}

              {selectedAppt.status === 'cancelled' && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                  <div className="font-semibold">Cancellation Record</div>
                  <div className="text-[11px] mt-0.5">
                    Reason: {selectedAppt.cancellationReason || 'No reason specified'}
                  </div>
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

      {/* CANCEL MODAL */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cancel Consultation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to cancel your appointment with{' '}
              <span className="font-semibold text-slate-800">
                {cancellingAppt.doctor?.user?.name}
              </span>{' '}
              on {cancellingAppt.appointmentDate} at {cancellingAppt.startTime}?
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Schedule conflict, feeling better, personal emergency..."
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
                  Keep Appointment
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={cancelLoading}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reschedule Consultation</h3>
              <button
                onClick={() => setReschedulingAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600">
                Select a new date and open consultation slot with{' '}
                <span className="font-semibold text-slate-800">
                  {reschedulingAppt.doctor?.user?.name}
                </span>.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Choose New Time Slot
                </label>
                {slotsLoading ? (
                  <div className="py-6 text-center text-slate-400 flex flex-col items-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mb-2" />
                    Checking open slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-center">
                    No slots available on this date. Please pick another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          type="button"
                          key={slot.startTime}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-2.5 rounded-lg font-semibold text-center border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReschedulingAppt(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={rescheduleLoading}
                  disabled={!selectedSlot}
                >
                  Confirm Reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
