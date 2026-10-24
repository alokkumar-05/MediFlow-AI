import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  BedDouble,
  HeartPulse,
  Edit2,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Stethoscope,
  User
} from 'lucide-react';

export default function NurseAssignedPatientsPage() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showCareModal, setShowCareModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Form
  const [careNotes, setCareNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchActiveInpatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/nurse/admissions?status=admitted');
      if (res.data?.success) {
        setAdmissions(res.data.admissions || []);
      }
    } catch (err) {
      console.error('Error fetching nurse admissions:', err);
      setError(err.response?.data?.message || 'Failed to load ward inpatients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveInpatients();
  }, []);

  const handleUpdateCareNotes = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.patch(`/nurse/admissions/${selectedAdmission._id}/care`, {
        notes: careNotes.trim()
      });

      if (res.data?.success) {
        setSuccessMessage('Bedside care notes updated successfully.');
        setShowCareModal(false);
        fetchActiveInpatients();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update care notes.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Inpatients & Ward Bed Roster"
        subtitle="Live ward monitor, bed occupancy, attending doctor orders, and bedside nursing notes"
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

      {/* Ward Occupancy Table */}
      <Card padding="none">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <p className="text-sm">Loading ward inpatients...</p>
          </div>
        ) : admissions.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <BedDouble className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">No active inpatients in ward</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              All admitted patients assigned to your ward will appear here with live bed coordinates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admissions.map((adm) => (
              <div
                key={adm._id}
                className="p-5 hover:bg-slate-50/75 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{adm.patient?.name}</span>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                      Bed: {adm.bedNumber}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      Admitted Inpatient
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong>Reason:</strong> {adm.admissionReason}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-primary-600" />
                      Attending: Dr. {adm.attendingDoctor?.user?.name || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Admitted: {new Date(adm.admissionDate).toLocaleDateString()}
                    </span>
                    <span>Dept: {adm.department?.name || 'Inpatient Ward'}</span>
                  </div>

                  {adm.notes && (
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600">
                      <strong>Nursing Care Directives:</strong> {adm.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
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
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Edit2}
                    onClick={() => {
                      setSelectedAdmission(adm);
                      setCareNotes(adm.notes || '');
                      setFormError('');
                      setShowCareModal(true);
                    }}
                  >
                    Care Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Update Bedside Care Modal */}
      {showCareModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary-600" />
                Update Bedside Care Directives
              </h3>
              <button onClick={() => setShowCareModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCareNotes} className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedAdmission.patient?.name}</div>
                <div><strong>Bed:</strong> {selectedAdmission.bedNumber}</div>
                <div><strong>Attending Doctor:</strong> Dr. {selectedAdmission.attendingDoctor?.user?.name}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bedside Observations & Care Directives
                </label>
                <textarea
                  rows={4}
                  value={careNotes}
                  onChange={(e) => setCareNotes(e.target.value)}
                  placeholder="Record patient mobility status, fluid intake, wound dress changes, or night shift remarks..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowCareModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Update Notes'}
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
              <h3 className="text-base font-bold text-slate-900">Inpatient Ward Chart</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div><strong>Patient:</strong> {selectedAdmission.patient?.name} ({selectedAdmission.patient?.email})</div>
                <div><strong>Bed Location:</strong> {selectedAdmission.bedNumber}</div>
                <div><strong>Department:</strong> {selectedAdmission.department?.name}</div>
                <div><strong>Attending Doctor:</strong> Dr. {selectedAdmission.attendingDoctor?.user?.name}</div>
                <div><strong>Admitted On:</strong> {new Date(selectedAdmission.admissionDate).toLocaleString()}</div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Admitting Diagnosis / Condition:</span>
                <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {selectedAdmission.admissionReason}
                </p>
              </div>

              {selectedAdmission.notes && (
                <div>
                  <span className="text-xs text-slate-500 block">Nursing Care Directives:</span>
                  <p className="text-slate-800 text-xs mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedAdmission.notes}
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
