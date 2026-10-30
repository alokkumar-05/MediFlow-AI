import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  CalendarPlus,
  Sparkles,
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';

export default function PatientBookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get('doctor') || '';

  // Data states
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    // Tomorrow as default booking date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form states
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch departments
  useEffect(() => {
    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const res = await api.get('/departments');
        if (res.data?.success) {
          setDepartments(res.data.departments || []);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  // Fetch doctors (filtered by department if selected)
  useEffect(() => {
    const fetchDocs = async () => {
      setLoadingDoctors(true);
      try {
        let url = '/doctors';
        if (selectedDeptId) {
          url += `?department=${selectedDeptId}`;
        }
        const res = await api.get(url);
        if (res.data?.success) {
          setDoctors(res.data.doctors || []);
          // If current selected doctor isn't in list, reset
          if (selectedDoctorId && !res.data.doctors.some((d) => d._id === selectedDoctorId)) {
            setSelectedDoctorId('');
          }
        }
      } catch (err) {
        console.error('Failed to load doctors', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDocs();
  }, [selectedDeptId]);

  // Fetch available slots when doctor and date change
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError('');
      setSelectedSlot(null);
      try {
        const res = await api.get(`/appointments/available-slots?doctorId=${selectedDoctorId}&date=${appointmentDate}`);
        if (res.data?.success) {
          setAvailableSlots(res.data.slots || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load consultation time slots.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, appointmentDate]);

  const selectedDoctorObj = doctors.find((d) => d._id === selectedDoctorId);

  // Handle Booking Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError('Please select a physician.');
      return;
    }
    if (!selectedSlot) {
      setError('Please choose an available time slot.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the consultation.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        doctorId: selectedDoctorId,
        departmentId: selectedDeptId || selectedDoctorObj?.department?.id || selectedDoctorObj?.department?._id,
        appointmentDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim(),
        notes: notes.trim(),
      };

      const res = await api.post('/patient/appointments', payload);
      if (res.data?.success) {
        setSuccessMessage('Appointment booked successfully! Redirecting to your appointments...');
        setTimeout(() => {
          navigate('/patient/appointments');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment. The slot may have just been booked.');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Book Outpatient Consultation"
        subtitle="Select a clinical specialty, pick your physician, and choose a verified conflict-free time slot"
      />

      {/* AI Triage Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Need help choosing a department?</p>
            <p className="text-slate-600 mt-0.5">Use our MediFlow-AI symptom triage assistant for guided clinical specialty recommendations.</p>
          </div>
        </div>
        <Link to="/patient/ai-assistant">
          <Button variant="outline" size="sm" icon={Sparkles} className="shrink-0 bg-white">
            Launch AI Triage
          </Button>
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Doctor & Specialty Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="1. Select Department & Physician" subtitle="Filter by clinical division and choose your doctor">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Clinical Department (Optional Filter)
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">All Hospital Departments</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Medical Specialist *
                  </label>
                  {loadingDoctors ? (
                    <div className="p-6 text-center text-xs text-slate-400">Loading rostered physicians...</div>
                  ) : doctors.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs">
                      No available doctors found in this department. Please choose another department.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                      {doctors.map((doc) => {
                        const isSelected = selectedDoctorId === doc._id;
                        return (
                          <div
                            key={doc._id}
                            onClick={() => setSelectedDoctorId(doc._id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {doc.name?.charAt(0) || 'D'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">{doc.name}</div>
                              <div className="text-[11px] font-medium text-blue-600 truncate">{doc.specialization}</div>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                <span>{doc.department?.name || 'Specialty'}</span>
                                <span className="font-bold text-slate-700">₹{doc.consultationFee}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title="2. Consultation Details" subtitle="Explain symptoms and context for the doctor">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Chief Complaint / Reason for Visit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sharp chest discomfort during exertion for 3 days"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Additional Notes / Medical History (Optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Prior diagnoses, allergies, current medications, or pre-existing conditions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Date & Time Slot Picker */}
          <div className="space-y-6">
            <Card title="3. Select Date & Slot" subtitle="Live real-time schedule">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Available Time Slots *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {availableSlots.length} available
                    </span>
                  </div>

                  {!selectedDoctorId ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                      Please pick a physician first to view open consultation slots.
                    </div>
                  ) : loadingSlots ? (
                    <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mb-2" />
                      Checking physician calendar...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs text-center">
                      No available consultation slots for this date. The doctor may be off duty or fully booked. Try selecting another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {availableSlots.map((slot) => {
                        const isChosen = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            type="button"
                            key={slot.startTime}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all text-center border ${
                              isChosen
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 hover:bg-blue-50/60 text-slate-700 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Booking Summary Box */}
                {selectedDoctorObj && selectedSlot && (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-2 mt-4">
                    <div className="font-bold text-slate-900 border-b border-blue-100 pb-1.5">
                      Booking Summary
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Doctor:</span>
                      <span className="font-semibold text-slate-800">{selectedDoctorObj.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Date & Time:</span>
                      <span className="font-semibold text-slate-800">
                        {appointmentDate} at {selectedSlot.startTime}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cabin / Room:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedDoctorObj.roomNumber || 'Consultation Suite'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-900 pt-1.5 border-t border-blue-100 font-bold">
                      <span>Consultation Fee:</span>
                      <span className="text-blue-700">₹{selectedDoctorObj.consultationFee}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={CalendarPlus}
                  loading={submitting}
                  disabled={!selectedDoctorId || !selectedSlot}
                  className="w-full justify-center mt-2"
                >
                  Confirm & Book Appointment
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
