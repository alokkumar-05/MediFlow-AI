import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Sparkles, Bot, FileText, AlertTriangle } from 'lucide-react';

export default function DoctorAiAssistantPage() {
  return (
    <div>
      <PageHeader
        title="AI Clinical Decision Support"
        subtitle="Gemini-assisted patient history distillation and lab report biomarker extraction"
      />

      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Physician Oversight Notice</p>
          <p className="mt-0.5">
            AI medical analysis acts strictly as a clinical assistant to accelerate record review. It does not replace independent medical judgment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Patient History Briefs" subtitle="Longitudinal synthesis engine">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <Bot className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">150-Word Clinical Summary</h4>
              <p className="text-xs text-slate-500 mt-1">
                Synthesizes past diagnoses, chronic conditions, and current medications into an instant briefing before beginning patient consultation (Phase 5).
              </p>
            </div>
          </div>
        </Card>

        <Card title="Lab Report Extraction" subtitle="Multimodal OCR & extraction">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Biomarker Verification</h4>
              <p className="text-xs text-slate-500 mt-1">
                Extracts lab parameters, normal reference ranges, and flags high/low values with a side-by-side doctor sign-off interface (Phase 5).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
