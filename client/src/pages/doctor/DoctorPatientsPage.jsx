import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Users,
  BedDouble,
  LogOut,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

export default function DoctorPatientsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('admitted');

  // Modals
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Form states
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [treatmentSummary, setTreatmentSummary] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAssignedAdmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/doctor/admissions?status=${statusFilter}`);
      if (res.data?.success) {
        setAdmissions(res.data.admissions || []);
      }
    } catch (err) {
      console.error('Error fetching doctor admissions:', err);
      setError(err.response?.data?.message || 'Failed to load assigned admissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedAdmissions();
  }, [statusFilter]);

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    if (!dischargeSummary.trim()) {
      setFormError('Clinical discharge summary is required.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.patch(`/doctor/admissions/${selectedAdmission._id}/discharge`, {
        dischargeSummary: dischargeSummary.trim(),
        treatmentSummary: treatmentSummary.trim()
      });

      if (res.data?.success) {
        setSuccessMessage('Patient successfully discharged with clinical directives.');
        setShowDischargeModal(false);
        setDischargeSummary('');
        setTreatmentSummary('');
        fetchAssignedAdmissions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to discharge patient.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Inpatients & Ward Caseload"
        subtitle="Manage assigned admitted patients, bed placements, and clinical discharge orders"
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

      {/* Filter Tabs */}
      <Card padding="none">
        <div className="flex border-b border-slate-200 text-sm font-semibold">
          <button
            onClick={() => setStatusFilter('admitted')}
            className={`px-6 py-3 border-b-2 transition ${
              statusFilter === 'admitted'
                ? 'border-primary-600 text-primary-600 bg-primary-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Currently Admitted Inpatients
          </button>
          <button
            onClick={() => setStatusFilter('discharged')}
            className={`px-6 py-3 border-b-2 transition ${
              statusFilter === 'discharged'
                ? 'border-primary-600 text-primary-600 bg-primary-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Discharge History
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading assigned inpatients...</p>
          </div>
        ) : admissions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No {statusFilter} patients found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Patients admitted under your clinical care will appear in this roster.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admissions.map((adm) => (
              <div
                key={adm._id}
                className="p-5 hover:bg-slate-50/75 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{adm.patient?.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Bed: {adm.bedNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                      adm.status === 'admitted'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {adm.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Admitting Reason:</strong> {adm.admissionReason}
                  </p>

                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span>Admitted: {new Date(adm.admissionDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Dept: {adm.department?.name || 'General Ward'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => {
                      setSelectedAdmission(adm);
                      setShowDetailModal(true);
                    }}
                  >
                    View Chart
                  </Button>

                  {adm.status === 'admitted' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={LogOut}
                      onClick={() => {
                        setSelectedAdmission(adm);
                        setDischargeSummary('');
                        setTreatmentSummary('');
                        setFormError('');
                        setShowDischargeModal(true);
                      }}
                    >
                      Discharge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Discharge Modal */}
      {showDischargeModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-600" />
                Issue Patient Discharge Orders
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
                <div><strong>Admission Date:</strong> {new Date(selectedAdmission.admissionDate).toLocaleDateString()}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discharge Clinical Summary *
                </label>
                <textarea
                  rows={3}
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  placeholder="Recovery progress, post-discharge medication instructions, and follow-up consultation requirements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inpatient Treatment & Course Summary
                </label>
                <textarea
                  rows={2}
                  value={treatmentSummary}
                  onChange={(e) => setTreatmentSummary(e.target.value)}
                  placeholder="Summary of completed surgical or pharmaceutical treatment course..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowDischargeModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Executing Discharge...' : 'Confirm & Discharge'}
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
              <h3 className="text-base font-bold text-slate-900">Inpatient Clinical Chart</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedAdmission.patient?.name}</div>
                <div><strong>Bed:</strong> {selectedAdmission.bedNumber}</div>
                <div><strong>Admitted On:</strong> {new Date(selectedAdmission.admissionDate).toLocaleString()}</div>
                <div><strong>Status:</strong> <span className="uppercase font-semibold">{selectedAdmission.status}</span></div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Admitting Diagnosis / Reason:</span>
                <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {selectedAdmission.admissionReason}
                </p>
              </div>

              {selectedAdmission.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">Ward Care Notes:</span>
                  <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedAdmission.notes}
                  </p>
                </div>
              )}

              {selectedAdmission.status === 'discharged' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900">Discharge Record</div>
                  <div><strong>Discharge Date:</strong> {new Date(selectedAdmission.dischargeDate).toLocaleString()}</div>
                  <div>
                    <strong>Summary:</strong>
                    <p className="mt-1 text-slate-700 bg-white/70 p-2 rounded">{selectedAdmission.dischargeSummary}</p>
                  </div>
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
