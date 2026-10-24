import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Pill,
  Trash2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Eye,
  Edit2
} from 'lucide-react';

export default function DoctorMedicalRecordsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form State
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [recordType, setRecordType] = useState('consultation');
  const [title, setTitle] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [treatment, setTreatment] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  // Fetch patients list
  const fetchPatients = async () => {
    try {
      // In MediFlow-AI, users with role 'patient' can be fetched via admin/users or appointments
      // Let's call /admin/users or fetch from appointments
      const res = await api.get('/doctor/appointments');
      if (res.data?.success) {
        // Extract unique patients from doctor's appointments
        const uniquePatientsMap = new Map();
        (res.data.appointments || []).forEach((appt) => {
          if (appt.patient && appt.patient._id) {
            uniquePatientsMap.set(appt.patient._id, appt.patient);
          }
        });
        const patientList = Array.from(uniquePatientsMap.values());
        setPatients(patientList);
        if (patientList.length > 0 && !selectedPatientId) {
          setSelectedPatientId(patientList[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching patients for doctor:', err);
    }
  };

  const fetchRecordsForPatient = async (patientId) => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/doctor/patients/${patientId}/medical-records`);
      if (res.data?.success) {
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
      setError(err.response?.data?.message || 'Failed to load medical records for patient.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchRecordsForPatient(selectedPatientId);
    }
  }, [selectedPatientId]);

  const handleAddPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const handleRemovePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index][field] = value;
    setPrescriptions(updated);
  };

  const handleCreateRecordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFormError('Please select a patient.');
      return;
    }
    if (!title.trim()) {
      setFormError('Record title is required.');
      return;
    }

    // Filter valid prescriptions
    const activePrescriptions = prescriptions.filter(
      (rx) => rx.medicationName.trim() || rx.dosage.trim()
    );

    for (let i = 0; i < activePrescriptions.length; i++) {
      const rx = activePrescriptions[i];
      if (!rx.medicationName.trim() || !rx.dosage.trim() || !rx.frequency.trim() || !rx.duration.trim()) {
        setFormError(`Medication row #${i + 1} must include Name, Dosage, Frequency, and Duration.`);
        return;
      }
    }

    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        patientId: selectedPatientId,
        recordType,
        title: title.trim(),
        description: description.trim(),
        diagnosis: diagnosis.trim(),
        symptoms: symptomsInput.split(',').map((s) => s.trim()).filter(Boolean),
        treatment: treatment.trim(),
        prescriptions: activePrescriptions,
        notes: notes.trim()
      };

      const res = await api.post('/doctor/medical-records', payload);
      if (res.data?.success) {
        setSuccessMessage('Medical record and prescription created successfully.');
        setShowCreateModal(false);
        // Reset form
        setTitle('');
        setDiagnosis('');
        setSymptomsInput('');
        setTreatment('');
        setDescription('');
        setNotes('');
        setPrescriptions([{ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        fetchRecordsForPatient(selectedPatientId);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create medical record.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Electronic Medical Records (EMR)"
        subtitle="Write clinical consultation charts, structured prescriptions, and review treatment history"
        action={
          <Button
            icon={Plus}
            variant="primary"
            onClick={() => {
              setFormError('');
              setShowCreateModal(true);
            }}
          >
            New Medical Record
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
              Select Attending Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            >
              {patients.length === 0 ? (
                <option value="">No patient appointments found</option>
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
            Showing records for authorized patient consultations
          </div>
        </div>
      </Card>

      {/* Records Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading patient records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No medical records on file for this patient</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Click &quot;New Medical Record&quot; to issue a consultation chart or prescription.
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
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {record.recordType}
                    </span>
                    {record.prescriptions?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Pill className="w-3 h-3" />
                        {record.prescriptions.length} Meds
                      </span>
                    )}
                  </div>
                  {record.diagnosis && (
                    <p className="text-xs text-slate-700 font-medium">
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Date: {new Date(record.recordDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Author: {record.createdBy?.name || 'Doctor'}</span>
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

      {/* New Medical Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Create Clinical Medical Record
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreateRecordSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Record Type *
                  </label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="prescription">Prescription</option>
                    <option value="treatment">Treatment</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="imaging">Imaging</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chart Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., General Outpatient Examination"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Clinical Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g., Acute Bronchitis, Hypertension Stage 1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reported Symptoms (comma separated)
                </label>
                <input
                  type="text"
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="e.g., Cough, Low fever, Fatigue"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Treatment / Clinical Plan
                </label>
                <textarea
                  rows={2}
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Detail treatment approach and therapy..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Structured Prescription Rows */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Structured Prescriptions
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPrescriptionRow}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Medication
                  </button>
                </div>

                <div className="space-y-3">
                  {prescriptions.map((rx, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                      {prescriptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrescriptionRow(idx)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-rose-600"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Medicine Name *</label>
                          <input
                            type="text"
                            placeholder="e.g., Amoxicillin 500mg"
                            value={rx.medicationName}
                            onChange={(e) => handlePrescriptionChange(idx, 'medicationName', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dosage *</label>
                          <input
                            type="text"
                            placeholder="e.g., 500mg"
                            value={rx.dosage}
                            onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Frequency *</label>
                          <input
                            type="text"
                            placeholder="e.g., Twice daily after food"
                            value={rx.frequency}
                            onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Duration *</label>
                          <input
                            type="text"
                            placeholder="e.g., 5 days"
                            value={rx.duration}
                            onChange={(e) => handlePrescriptionChange(idx, 'duration', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Special Instructions</label>
                        <input
                          type="text"
                          placeholder="e.g., Take with plenty of water"
                          value={rx.instructions}
                          onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confidential Clinical Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Doctor's notes for subsequent visits..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving Record...' : 'Save & Issue Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{selectedRecord.title}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedRecord.patient?.name} ({selectedRecord.patient?.email})</div>
                <div><strong>Date:</strong> {new Date(selectedRecord.recordDate).toLocaleDateString()}</div>
                <div><strong>Type:</strong> <span className="uppercase">{selectedRecord.recordType}</span></div>
              </div>

              {selectedRecord.diagnosis && (
                <div>
                  <span className="text-xs text-slate-500 block">Diagnosis</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedRecord.diagnosis}</p>
                </div>
              )}

              {selectedRecord.treatment && (
                <div>
                  <span className="text-xs text-slate-500 block">Treatment Plan</span>
                  <p className="text-slate-800 text-xs mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedRecord.treatment}
                  </p>
                </div>
              )}

              {selectedRecord.prescriptions?.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-emerald-800 block mb-1">Prescriptions</span>
                  <div className="space-y-1.5">
                    {selectedRecord.prescriptions.map((rx, i) => (
                      <div key={i} className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs">
                        <div className="font-bold text-slate-900">{rx.medicationName} ({rx.dosage})</div>
                        <div className="text-slate-600 mt-0.5">{rx.frequency} • {rx.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">Clinical Notes</span>
                  <p className="text-slate-800 text-xs mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedRecord.notes}
                  </p>
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
    </div>
  );
}
