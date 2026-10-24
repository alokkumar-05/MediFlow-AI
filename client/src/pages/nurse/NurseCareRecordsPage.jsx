import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  HeartPulse,
  Plus,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

export default function NurseCareRecordsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [title, setTitle] = useState('Routine Inpatient Vitals Check');
  const [notes, setNotes] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [rr, setRr] = useState('');

  const fetchPatients = async () => {
    try {
      // In MediFlow, fetch user list from admin or public doctors/appointments
      // As a nurse, we can fetch patients through appointments or registered patient list
      const res = await api.get('/admin/users?role=patient').catch(() => null);
      if (res?.data?.success && res.data.users?.length > 0) {
        setPatients(res.data.users);
        setSelectedPatientId(res.data.users[0]._id);
      }
    } catch (err) {
      console.error('Error fetching patients for nurse:', err);
    }
  };

  const fetchRecords = async (patientId) => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/nurse/patients/${patientId}/medical-records`);
      if (res.data?.success) {
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err.response?.data?.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchRecords(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        patientId: selectedPatientId,
        title: title.trim() || 'Vitals & Nursing Observation',
        notes: notes.trim(),
        vitals: {
          bloodPressure: bp.trim(),
          heartRate: hr.trim(),
          temperature: temp.trim(),
          oxygenSaturation: spo2.trim(),
          respiratoryRate: rr.trim()
        }
      };

      const res = await api.post('/nurse/observations', payload);
      if (res.data?.success) {
        setSuccessMessage('Vitals recorded successfully.');
        setShowVitalsModal(false);
        // Reset form
        setBp('');
        setHr('');
        setTemp('');
        setSpo2('');
        setRr('');
        setNotes('');
        fetchRecords(selectedPatientId);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record vitals.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vitals & Nursing Care Records"
        subtitle="Log patient vital signs (Blood Pressure, Heart Rate, SpO2, Temperature) and clinical nursing observations"
        action={
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => {
              setFormError('');
              setShowVitalsModal(true);
            }}
          >
            Record Vitals
          </Button>
        }
      />

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

      {/* Patient Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient Chart
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              {patients.length === 0 ? (
                <option value="">No patients available</option>
              ) : (
                patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Nurse scope: Vitals recording & observation notes
          </div>
        </div>
      </Card>

      {/* Records Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading care records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <HeartPulse className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No care records found for this patient</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Click &quot;Record Vitals&quot; to log blood pressure, pulse, and observations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record) => (
              <div
                key={record._id}
                className="p-5 hover:bg-slate-50/75 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{record.title}</span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {record.recordType}
                    </span>
                  </div>
                  {record.vitals && (
                    <div className="flex items-center gap-3 text-xs text-slate-700 font-mono mt-1">
                      <span>BP: <strong>{record.vitals.bloodPressure || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>HR: <strong>{record.vitals.heartRate || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Temp: <strong>{record.vitals.temperature || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>SpO2: <strong>{record.vitals.oxygenSaturation || 'N/A'}</strong></span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Date: {new Date(record.recordDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Recorded by: {record.createdBy?.name || 'Staff'}</span>
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  onClick={() => {
                    setSelectedRecord(record);
                    setShowDetailModal(true);
                  }}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Record Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Record Patient Vital Signs
              </h3>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleRecordVitals} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observation Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning Shift Vitals"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 120/80 mmHg"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heart Rate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 76 bpm"
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temperature
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 98.6 °F"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Oxygen (SpO2)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 99%"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resp Rate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 16/min"
                    value={rr}
                    onChange={(e) => setRr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nursing Observations & Patient Status
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Patient comfort, mobility, hydration, oral intake notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowVitalsModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Recording...' : 'Commit Vitals'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{selectedRecord.title}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedRecord.patient?.name}</div>
                <div><strong>Recorded:</strong> {new Date(selectedRecord.recordDate).toLocaleDateString()}</div>
                <div><strong>Logged By:</strong> {selectedRecord.createdBy?.name || 'Staff'}</div>
              </div>

              {selectedRecord.vitals && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-xs font-mono">
                  <div>BP: {selectedRecord.vitals.bloodPressure || 'N/A'}</div>
                  <div>Pulse: {selectedRecord.vitals.heartRate || 'N/A'}</div>
                  <div>Temp: {selectedRecord.vitals.temperature || 'N/A'}</div>
                  <div>SpO2: {selectedRecord.vitals.oxygenSaturation || 'N/A'}</div>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">Observations:</span>
                  <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedRecord.notes}
                  </p>
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
