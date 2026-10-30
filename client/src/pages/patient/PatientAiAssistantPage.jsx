import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Sparkles, AlertCircle, Compass, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientAiAssistantPage() {
  const [symptoms, setSymptoms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [sampleResult, setSampleResult] = useState(null);

  const handleDemoTriage = (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setAnalyzing(true);
    // Simulate clinical triage analysis
    setTimeout(() => {
      setSampleResult({
        recommendedDepartment: 'Gastroenterology',
        urgency: 'Routine',
        rationale: 'Reported symptoms of localized abdominal discomfort and post-prandial fullness suggest digestive tract evaluation.',
        disclaimer: 'This recommendation is an AI workflow assistance tool and does not constitute medical advice or a diagnosis.',
      });
      setAnalyzing(false);
    }, 800);
  };

  return (
    <div>
      <PageHeader
        title="AI Symptom Triage Assistant"
        subtitle="Describe your symptoms in plain language to identify the most appropriate clinical specialty"
      />

      {/* Safety Notice */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Medical Emergency Notice</p>
          <p className="mt-0.5">
            If you are experiencing severe chest pain, shortness of breath, sudden numbness, or heavy bleeding, visit the nearest hospital emergency room immediately. This triage tool is for routine outpatient direction only.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Describe Your Symptoms" subtitle="Pre-consultation guidance" className="lg:col-span-2">
          <form onSubmit={handleDemoTriage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                What symptoms are you experiencing?
              </label>
              <textarea
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Mild dull ache in the upper abdomen after meals for the past 3 days..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={analyzing || !symptoms.trim()}
              icon={Sparkles}
            >
              {analyzing ? 'Analyzing Symptoms...' : 'Analyze Symptoms'}
            </Button>
          </form>

          {sampleResult && (
            <div className="mt-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200/70">
              <span className="text-[10px] font-semibold uppercase text-blue-700 tracking-wider">
                Recommended Department
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {sampleResult.recommendedDepartment}
              </h4>
              <p className="text-xs text-slate-600 mt-2">{sampleResult.rationale}</p>
              
              <div className="mt-4 pt-3 border-t border-blue-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Priority: {sampleResult.urgency}
                </span>

                <Link to="/patient/book-appointment">
                  <Button variant="primary" size="sm" icon={ArrowRight}>
                    Book in {sampleResult.recommendedDepartment}
                  </Button>
                </Link>
              </div>

              <p className="text-[10px] text-slate-400 mt-3 italic">
                {sampleResult.disclaimer}
              </p>
            </div>
          )}
        </Card>

        <Card title="How AI Triage Works" subtitle="Clinical decision support integration">
          <div className="space-y-3 text-xs text-slate-600">
            <p>1. Analyzes your natural-language symptom descriptions.</p>
            <p>2. Compares symptoms against hospital specialty divisions.</p>
            <p>3. Identifies red-flag emergency symptoms for urgent care alerts.</p>
            <p>4. Pre-fills your appointment booking form with the matching department.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
