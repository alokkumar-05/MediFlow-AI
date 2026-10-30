import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Sparkles,
  Bot,
  FileText,
  AlertTriangle,
  User,
  HeartPulse,
  Stethoscope,
  Pill,
  Hospital,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  Upload,
} from 'lucide-react';
import MedicalReportAnalysisModal from '../../components/MedicalReportAnalysisModal.jsx';

export default function DoctorAiAssistantPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Summary State
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryData, setSummaryData] = useState(null);

  // AI Report Analysis State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportAnalysisData, setReportAnalysisData] = useState(null);
  const [reportFileName, setReportFileName] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadText, setUploadText] = useState('');
  const [uploadRecordTitle, setUploadRecordTitle] = useState('');
  const [saveToRecord, setSaveToRecord] = useState(true);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await api.get('/doctor/appointments');
      if (res.data?.success) {
        const uniqueMap = new Map();
        (res.data.appointments || []).forEach((appt) => {
          if (appt.patient && appt.patient._id) {
            uniqueMap.set(appt.patient._id, appt.patient);
          }
        });
        const list = Array.from(uniqueMap.values());
        setPatients(list);
        if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching patients for AI Assistant:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleGenerateSummary = async (patientId) => {
    const targetId = patientId || selectedPatientId;
    if (!targetId) return;

    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await api.post(`/doctor/patients/${targetId}/ai-summary`);
      if (res.data?.success) {
        setSummaryData(res.data);
      } else {
        setSummaryError(res.data?.message || 'Failed to generate AI history summary.');
      }
    } catch (err) {
      console.error('Error generating AI history summary:', err);
      setSummaryError(
        err.response?.data?.message || 'AI summary service error. Please verify network connection or try again.'
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleUploadAndAnalyzeReport = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setReportError('Please select a patient first.');
      return;
    }

    if (!uploadFile && !uploadText.trim()) {
      setReportError('Please select a PDF or image file, or enter report text.');
      return;
    }

    setShowReportModal(true);
    setReportLoading(true);
    setReportError('');
    setUploadModalOpen(false);

    try {
      let fileBase64 = null;
      let mimeType = 'application/pdf';

      if (uploadFile) {
        mimeType = uploadFile.type || 'application/pdf';
        setReportFileName(uploadFile.name);
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(uploadFile);
        });
      } else {
        setReportFileName(uploadRecordTitle || 'Narrative Diagnostic Report');
        mimeType = 'text/plain';
      }

      const payload = {
        fileBase64,
        mimeType,
        fileName: uploadFile ? uploadFile.name : uploadRecordTitle,
        textContent: uploadText.trim() || undefined,
        saveToRecord,
        recordTitle: uploadRecordTitle.trim() || (uploadFile ? uploadFile.name.replace(/\.[^/.]+$/, '') : 'Medical Report Analysis'),
      };

      const res = await api.post(`/doctor/patients/${selectedPatientId}/analyze-report`, payload);
      if (res.data?.success) {
        setReportAnalysisData(res.data);
      } else {
        setReportError(res.data?.message || 'Failed to analyze report.');
      }
    } catch (err) {
      console.error('Error analyzing uploaded report:', err);
      setReportError(err.response?.data?.message || 'AI report analysis failed. Please verify provider connectivity.');
    } finally {
      setReportLoading(false);
    }
  };

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);
  const sections = summaryData?.summary?.sections || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Clinical Decision Support"
        subtitle="MediFlow-AI patient history distillation, multimodal report extraction, and clinical record synthesis"
      />

      {/* Physician Oversight Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950">Physician Oversight Notice &amp; Clinical Review Disclaimer</p>
          <p className="mt-0.5 leading-relaxed">
            AI medical analysis is grounded strictly in documented hospital encounters and acts strictly as a clinical documentation assistant to accelerate chart review. It does not replace independent medical judgment or constitute formal diagnosis.
          </p>
        </div>
      </div>

      {/* Patient Selection & Summary Trigger */}
      <Card>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Attending Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => {
                setSelectedPatientId(e.target.value);
                setSummaryData(null);
                setSummaryError('');
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {patients.length === 0 ? (
                <option value="">No authorized patient appointments found</option>
              ) : (
                patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => handleGenerateSummary(selectedPatientId)}
              disabled={!selectedPatientId || summaryLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 w-full md:w-auto"
            >
              {summaryLoading ? 'MediFlow-AI is synthesizing...' : 'Generate AI History Summary'}
            </Button>
            <Button
              variant="outline"
              icon={Upload}
              onClick={() => {
                setUploadFile(null);
                setUploadText('');
                setUploadRecordTitle('');
                setUploadModalOpen(true);
              }}
              disabled={!selectedPatientId || reportLoading}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 shadow-sm w-full md:w-auto"
            >
              Analyze Medical Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Active AI Summary Results Display */}
      {summaryLoading && (
        <Card>
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-800">MediFlow-AI is synthesizing clinical history...</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Analyzing documented consultations, diagnoses, prescription regimens, and inpatient admissions.
            </p>
          </div>
        </Card>
      )}

      {summaryError && !summaryLoading && (
        <Card>
          <div className="py-8 p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-rose-900">Summary Generation Notice</h4>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{summaryError}</p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => handleGenerateSummary(selectedPatientId)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry Summary Generation
              </Button>
            </div>
          </div>
        </Card>
      )}

      {summaryData && !summaryLoading && (
        <div className="space-y-5">
          {/* Summary Metadata & Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Clinical Distillation: {summaryData.patient?.name || selectedPatient?.name}
                {summaryData.summary?.isFallback && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Grounded Baseline
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: <span className="text-indigo-600 font-medium">{summaryData.summary?.modelUsed}</span> • Generated: {new Date(summaryData.generatedAt).toLocaleTimeString()}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => handleGenerateSummary(selectedPatientId)}
            >
              Regenerate
            </Button>
          </div>

          {/* 6 Structured Clinical Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Patient Overview */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <User className="w-4 h-4 text-indigo-600" />
                  1. Patient Overview
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.patientOverview || 'Not documented in hospital records.'}
                </div>
              </div>
            </Card>

            {/* 2. Relevant Medical History */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                  <HeartPulse className="w-4 h-4 text-blue-600" />
                  2. Relevant Medical History
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.relevantMedicalHistory || 'Not documented in hospital records.'}
                </div>
              </div>
            </Card>

            {/* 3. Previous Diagnoses and Treatments */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  3. Previous Diagnoses &amp; Treatments
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.previousDiagnosesAndTreatments || 'Not documented in hospital records.'}
                </div>
              </div>
            </Card>

            {/* 4. Medications Mentioned in Records */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-900">
                  <Pill className="w-4 h-4 text-purple-600" />
                  4. Medications Mentioned in Records
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.medicationsMentioned || 'Not documented in hospital records.'}
                </div>
              </div>
            </Card>

            {/* 5. Admission History */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-900">
                  <Hospital className="w-4 h-4 text-cyan-600" />
                  5. Admission History
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.admissionHistory || 'Not documented in hospital records.'}
                </div>
              </div>
            </Card>

            {/* 6. Important Missing Information */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  6. Important Missing Information
                </div>
                <div className="text-xs text-amber-950 whitespace-pre-line leading-relaxed pl-6">
                  {sections.importantMissingInformation || 'Allergies, family history, and immunization status are not documented.'}
                </div>
              </div>
            </Card>
          </div>

          {/* Audit Trail Badge */}
          {summaryData.sources && (
            <div className="flex items-center gap-4 px-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-slate-400" />
                Documented Consultations: <strong className="text-slate-700">{summaryData.sources.medicalRecordsCount}</strong>
              </span>
              <span>•</span>
              <span>Inpatient Admissions: <strong className="text-slate-700">{summaryData.sources.admissionsCount}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Feature Explanatory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card title="Patient History Briefs" subtitle="Longitudinal synthesis engine">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Bot className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Grounded Clinical Summarization</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Synthesizes past diagnoses, treatments, medications, and admission history strictly from documented records before beginning consultations.
              </p>
            </div>
          </div>
        </Card>

        <Card title="AI Medical Report Analysis" subtitle="Multimodal OCR & extraction">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Biomarker &amp; Report Verification</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Extracts lab parameters, normal reference ranges, and flags high/low values from uploaded PDFs and images with strict clinical grounding.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Medical Report Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Analyze Medical Report</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadAndAnalyzeReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Title / Descriptor (Optional)
                </label>
                <input
                  type="text"
                  value={uploadRecordTitle}
                  onChange={(e) => setUploadRecordTitle(e.target.value)}
                  placeholder="e.g. CBC Blood Panel / Chest X-Ray / Lipid Profile"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Document or Image File (PDF, PNG, JPG, WEBP)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-200 rounded-lg p-1.5 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">Maximum file size: 10MB.</p>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-slate-400">Or Paste Text</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Text Content (Narrative or Lab Text)
                </label>
                <textarea
                  rows={4}
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  placeholder="Paste laboratory values, diagnostic summary, or findings text here..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-700">
                <input
                  type="checkbox"
                  id="doctorAiSaveRecordCheck"
                  checked={saveToRecord}
                  onChange={(e) => setSaveToRecord(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="doctorAiSaveRecordCheck" className="cursor-pointer">
                  Save structured analysis to patient electronic medical records
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!uploadFile && !uploadText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Analyze Report with MediFlow-AI
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Medical Report Analysis Modal */}
      <MedicalReportAnalysisModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        analysisData={reportAnalysisData}
        loading={reportLoading}
        error={reportError}
        onRetry={
          uploadFile || uploadText
            ? handleUploadAndAnalyzeReport
            : undefined
        }
        patientName={selectedPatient?.name}
        fileName={reportFileName}
      />
    </div>
  );
}
