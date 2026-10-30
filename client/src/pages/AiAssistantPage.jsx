import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Sparkles, FileText, Bot, Compass, ShieldAlert, Info } from 'lucide-react';

export default function AiAssistantPage() {
  return (
    <div>
      <PageHeader
        title="AI Clinical Intelligence Hub"
        subtitle="AI-assisted triage, multimodal report extraction, and longitudinal history distillation"
      />

      {/* Medical Disclaimer Alert */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">Clinical Assistance Protocol Notice</p>
          <p className="text-amber-800/90 text-xs mt-0.5">
            AI capabilities in MediFlow-AI provide decision support and workflow assistance only. AI outputs do not constitute a clinical diagnosis. All summaries and extracted lab parameters require clinician verification before being committed to permanent patient medical records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Feature 1 */}
        <Card 
          title="AI Symptom Triage" 
          subtitle="Pre-consultation department matching"
          footer={<span className="text-xs text-emerald-600 font-medium">Production Feature</span>}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Analyzes natural-language patient complaints via MediFlow-AI to recommend the most appropriate medical department and flag urgent emergency symptoms.
          </p>
        </Card>

        {/* Feature 2 */}
        <Card 
          title="Report Analysis & OCR" 
          subtitle="Multimodal biomarker extraction"
          footer={<span className="text-xs text-emerald-600 font-medium">Production Feature</span>}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Extracts numerical biomarkers, units, and out-of-range indicators from uploaded lab PDFs and images, presenting an editable side-by-side verification view for doctors.
          </p>
        </Card>

        {/* Feature 3 */}
        <Card 
          title="Patient History Briefs" 
          subtitle="150-word clinical timeline summary"
          footer={<span className="text-xs text-emerald-600 font-medium">Production Feature</span>}
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Bot className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Synthesizes past visits, recurring diagnoses, active medications, and known drug allergies into a rapid 1-page briefing before a doctor begins consultation.
          </p>
        </Card>
      </div>

      <Card title="AI Service Connectivity" subtitle="Architecture pipeline status">
        <div className="py-8 text-center flex flex-col items-center">
          <Sparkles className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">MediFlow-AI Clinical Engine Connected</p>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            API endpoints (<code className="font-mono text-slate-600">/api/v1/ai/*</code>) and secure PII-sanitization middleware are active with clinical grounding safeguards.
          </p>
        </div>
      </Card>
    </div>
  );
}
