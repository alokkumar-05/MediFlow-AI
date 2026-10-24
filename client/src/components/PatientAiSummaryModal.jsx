import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  RefreshCw,
  X,
  User,
  HeartPulse,
  Stethoscope,
  Pill,
  Hospital,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import Button from './Button.jsx';

export default function PatientAiSummaryModal({
  isOpen,
  onClose,
  summaryData,
  loading,
  error,
  onRegenerate,
  patientName,
}) {
  if (!isOpen) return null;

  const sections = summaryData?.summary?.sections || {};
  const isFallback = summaryData?.summary?.isFallback;
  const modelUsed = summaryData?.summary?.modelUsed || 'Gemini Pro Clinical Engine';
  const disclaimer =
    summaryData?.disclaimer ||
    'This summary is AI-generated from documented hospital records for clinical review only and does not constitute a formal diagnosis or medical advice.';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                AI Patient History Summary
                {isFallback && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Grounded Baseline
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patientName || 'Selected Patient'}</span> • Engine: <span className="text-indigo-600 font-medium">{modelUsed}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Clinical Disclaimer Alert */}
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-950">Clinical Review Notice: </span>
            {disclaimer}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Synthesizing clinical records with Gemini AI...</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Parsing documented consultations, inpatient admissions, diagnoses, prescriptions, and identifying missing medical information.
              </p>
            </div>
          ) : error ? (
            <div className="py-12 p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-rose-900">Summary Generation Encountered an Issue</h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={onRegenerate}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Patient Overview */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <User className="w-4 h-4 text-indigo-600" />
                  1. Patient Overview
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.patientOverview || 'Not documented in hospital records.'}
                </div>
              </div>

              {/* 2. Relevant Medical History */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <HeartPulse className="w-4 h-4 text-blue-600" />
                  2. Relevant Medical History
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.relevantMedicalHistory || 'Not documented in hospital records.'}
                </div>
              </div>

              {/* 3. Previous Diagnoses and Treatments */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  3. Previous Diagnoses &amp; Treatments
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.previousDiagnosesAndTreatments || 'Not documented in hospital records.'}
                </div>
              </div>

              {/* 4. Medications Mentioned in Records */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Pill className="w-4 h-4 text-purple-600" />
                  4. Medications Mentioned in Records
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.medicationsMentioned || 'Not documented in hospital records.'}
                </div>
              </div>

              {/* 5. Admission History */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Hospital className="w-4 h-4 text-cyan-600" />
                  5. Admission History
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                  {sections.admissionHistory || 'Not documented in hospital records.'}
                </div>
              </div>

              {/* 6. Important Missing Information */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  6. Important Missing Information
                </div>
                <div className="text-xs text-amber-950 whitespace-pre-line leading-relaxed pl-6">
                  {sections.importantMissingInformation || 'Allergies, family history, and immunization status are not documented in hospital records.'}
                </div>
              </div>

              {/* Data Sources Audit Badge */}
              {summaryData?.sources && (
                <div className="flex items-center gap-4 px-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    Consultations &amp; Records: {summaryData.sources.medicalRecordsCount}
                  </span>
                  <span>•</span>
                  <span>Inpatient Admissions: {summaryData.sources.admissionsCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Summary
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
