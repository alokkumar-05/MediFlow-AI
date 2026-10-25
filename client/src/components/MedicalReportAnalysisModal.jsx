import React from 'react';
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  Calendar,
  AlertCircle,
  HelpCircle,
  Activity,
  FileCheck2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Button from './Button.jsx';

export default function MedicalReportAnalysisModal({
  isOpen,
  onClose,
  analysisData,
  loading,
  error,
  onRetry,
  patientName,
  fileName,
}) {
  if (!isOpen) return null;

  const analysis = analysisData?.analysis || {};
  const reportType = analysis.reportType || 'Medical Diagnostic Report';
  const reportDate = analysis.reportDate || 'Not documented';
  const keyFindings = analysis.keyFindings || [];
  const testResults = analysis.testResults || [];
  const valuesMarkedAbnormal = analysis.valuesMarkedAbnormal || [];
  const plainLanguageSummary = analysis.plainLanguageSummary || '';
  const doctorDiscussionQuestions = analysis.doctorDiscussionQuestions || [];
  const unreadableOrMissingInfo = analysis.unreadableOrMissingInfo || '';
  const disclaimer =
    analysis.disclaimer ||
    'This analysis is AI-generated for clinical review assistance only and does not constitute a formal diagnosis, medical advice, or treatment recommendation. All findings must be verified by a qualified physician.';

  const getFlagBadge = (flag) => {
    if (!flag) return null;
    const lower = String(flag).toLowerCase();
    if (lower === 'high' || lower === 'abnormal' || lower === 'positive') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
          {flag}
        </span>
      );
    }
    if (lower === 'low') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
          {flag}
        </span>
      );
    }
    if (lower === 'normal' || lower === 'negative') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
          {flag}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {flag}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                AI Medical Report Analysis
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Grounded Extraction
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {patientName && (
                  <>
                    Patient: <span className="font-semibold text-slate-800">{patientName}</span> •{' '}
                  </>
                )}
                Document: <span className="text-emerald-700 font-medium">{fileName || reportType}</span>
                {analysisData?.modelUsed && (
                  <> • Engine: <span className="text-slate-600 font-medium">{analysisData.modelUsed}</span></>
                )}
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

        {/* Mandatory Clinical Review Disclaimer */}
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
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Analyzing medical report with Gemini AI...</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Extracting biomarkers, clinical units, documented reference ranges, abnormal flags, and synthesizing structured explanations.
              </p>
            </div>
          ) : error ? (
            <div className="py-12 p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-bold text-rose-900">Analysis Encountered an Issue</h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
              {onRetry && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Retry Analysis
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Meta: Report Type & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Document / Test Type:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{reportType}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Documented Date:
                  </span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{reportDate}</p>
                </div>
              </div>

              {/* Abnormal Flags Callout if any */}
              {valuesMarkedAbnormal.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Values Documented Out of Range or Abnormal ({valuesMarkedAbnormal.length})
                  </div>
                  <ul className="list-disc pl-5 text-xs text-rose-800 space-y-1">
                    {valuesMarkedAbnormal.map((item, idx) => (
                      <li key={idx} className="font-medium">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structured Laboratory / Test Results Table */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Documented Test Values &amp; Reference Ranges ({testResults.length})
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Test Name</th>
                          <th className="py-2.5 px-3">Measured Value</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {testResults.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{row.testName}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{row.value}</td>
                            <td className="py-2.5 px-3 text-slate-600">{row.unit || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                              {row.referenceRange || 'Not specified'}
                            </td>
                            <td className="py-2.5 px-3">{getFlagBadge(row.flag)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {keyFindings.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Key Findings Stated in Report
                  </div>
                  <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                    {keyFindings.map((finding, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Plain Language Summary */}
              {plainLanguageSummary && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    Plain-Language Explanation (Informational)
                  </div>
                  <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {plainLanguageSummary}
                  </div>
                </div>
              )}

              {/* Questions to Discuss With Doctor */}
              {doctorDiscussionQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-900">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    Suggested Questions for Clinical Discussion
                  </div>
                  <ul className="list-disc pl-5 text-xs text-purple-950 space-y-1">
                    {doctorDiscussionQuestions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unreadable or Missing Information Notice */}
              {unreadableOrMissingInfo && unreadableOrMissingInfo !== 'None observed.' && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    Missing, Unreadable, or Ambiguous Information:
                  </div>
                  <p className="text-slate-600 pl-5">{unreadableOrMissingInfo}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Re-analyze Report
            </Button>
          ) : (
            <div />
          )}

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
