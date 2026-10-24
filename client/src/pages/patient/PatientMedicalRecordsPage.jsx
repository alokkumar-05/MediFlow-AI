import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  FileText,
  Calendar,
  Clock,
  Stethoscope,
  Pill,
  Activity,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function PatientMedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Record Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('recordType', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/patient/medical-records?${params.toString()}`);
      if (res.data?.success) {
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(err.response?.data?.message || 'Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [typeFilter, startDate, endDate]);

  const getRecordTypeBadge = (type) => {
    const badges = {
      consultation: 'bg-blue-50 text-blue-700 border-blue-200',
      diagnosis: 'bg-purple-50 text-purple-700 border-purple-200',
      prescription: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      lab_report: 'bg-amber-50 text-amber-700 border-amber-200',
      imaging: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      treatment: 'bg-teal-50 text-teal-700 border-teal-200',
      nursing_observation: 'bg-rose-50 text-rose-700 border-rose-200',
      other: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badges[type] || badges.other}`}>
        {type ? type.replace('_', ' ').toUpperCase() : 'RECORD'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Medical Records & Prescriptions"
        subtitle="Access your verified consultation charts, clinical prescriptions, and medical history"
      />

      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3 text-xs text-blue-800">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Privacy & Data Isolation</p>
          <p className="mt-0.5">
            Your electronic medical records are strictly protected. Only you and authorized hospital medical staff can view these clinical records.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Record Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="prescription">Prescription</option>
              <option value="treatment">Treatment</option>
              <option value="lab_report">Lab Report</option>
              <option value="imaging">Imaging</option>
              <option value="nursing_observation">Nursing Observation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end">
            {(typeFilter || startDate || endDate) && (
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setTypeFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {/* Records Timeline / List */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading your medical records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No medical records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Clinical consultation summaries, doctor diagnoses, and prescriptions will appear here after your visits.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record) => (
              <div
                key={record._id}
                onClick={() => {
                  setSelectedRecord(record);
                  setShowDetailModal(true);
                }}
                className="p-5 hover:bg-slate-50/75 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{record.title}</span>
                    {getRecordTypeBadge(record.recordType)}
                    {record.prescriptions?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Pill className="w-3 h-3" />
                        {record.prescriptions.length} Meds
                      </span>
                    )}
                  </div>

                  {record.diagnosis && (
                    <p className="text-xs text-slate-600 font-medium">
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(record.recordDate).toLocaleDateString()}
                    </span>
                    {record.doctor && (
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-primary-600" />
                        Dr. {record.doctor?.user?.name || 'Attending Physician'}
                      </span>
                    )}
                    {record.vitals && (
                      <span className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                        <Activity className="w-3 h-3 text-rose-500" />
                        BP: {record.vitals.bloodPressure || 'N/A'} | HR: {record.vitals.heartRate || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button variant="outline" size="sm" icon={Eye}>
                    View Chart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-bold text-slate-900">{selectedRecord.title}</h3>
                {getRecordTypeBadge(selectedRecord.recordType)}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Record Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedRecord.recordDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Physician / Author</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRecord.doctor ? `Dr. ${selectedRecord.doctor.user?.name}` : selectedRecord.createdBy?.name || 'Hospital Staff'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-semibold text-slate-800 uppercase">{selectedRecord.recordType}</span>
                </div>
              </div>

              {selectedRecord.diagnosis && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Clinical Diagnosis</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 text-sm">
                    {selectedRecord.diagnosis}
                  </p>
                </div>
              )}

              {selectedRecord.symptoms?.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Symptoms Reported</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecord.symptoms.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.description && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Clinical Findings & Summary</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed">
                    {selectedRecord.description}
                  </p>
                </div>
              )}

              {selectedRecord.treatment && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Treatment Plan</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed">
                    {selectedRecord.treatment}
                  </p>
                </div>
              )}

              {/* Structured Prescriptions */}
              {selectedRecord.prescriptions?.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Prescribed Medications ({selectedRecord.prescriptions.length})
                  </span>
                  <div className="space-y-2">
                    {selectedRecord.prescriptions.map((rx, idx) => (
                      <div key={rx._id || idx} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                          <span>{rx.medicationName}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-xs">
                            {rx.dosage}
                          </span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 text-slate-600 text-xs">
                          <div><strong>Frequency:</strong> {rx.frequency}</div>
                          <div><strong>Duration:</strong> {rx.duration}</div>
                        </div>
                        {rx.instructions && (
                          <div className="mt-1.5 text-slate-700 bg-white/80 p-2 rounded border border-emerald-100 text-[11px]">
                            <strong>Instructions:</strong> {rx.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vitals if present */}
              {selectedRecord.vitals && (
                <div>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <Activity className="w-4 h-4 text-rose-500" />
                    Recorded Vital Signs
                  </span>
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
                    <div><strong>BP:</strong> {selectedRecord.vitals.bloodPressure || 'N/A'}</div>
                    <div><strong>Heart Rate:</strong> {selectedRecord.vitals.heartRate || 'N/A'}</div>
                    <div><strong>Temperature:</strong> {selectedRecord.vitals.temperature || 'N/A'}</div>
                    <div><strong>SpO2:</strong> {selectedRecord.vitals.oxygenSaturation || 'N/A'}</div>
                    <div><strong>Resp Rate:</strong> {selectedRecord.vitals.respiratoryRate || 'N/A'}</div>
                  </div>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">Additional Notes</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed">
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
