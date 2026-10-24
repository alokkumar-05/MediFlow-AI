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
} from 'lucide-react';

export default function DoctorAiAssistantPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Summary State
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryData, setSummaryData] = useState(null);

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

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);
  const sections = summaryData?.summary?.sections || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Clinical Decision Support"
        subtitle="Gemini-assisted patient history distillation and clinical record synthesis"
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => handleGenerateSummary(selectedPatientId)}
              disabled={!selectedPatientId || summaryLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 w-full md:w-auto"
            >
              {summaryLoading ? 'Synthesizing with Gemini...' : 'Generate AI History Summary'}
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
            <p className="text-sm font-semibold text-slate-800">Synthesizing clinical history with Gemini AI...</p>
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

        <Card title="Lab Report Extraction" subtitle="Multimodal OCR & extraction">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Biomarker Verification</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Extracts lab parameters, normal reference ranges, and flags high/low values with a side-by-side doctor sign-off interface (Phase 5).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
