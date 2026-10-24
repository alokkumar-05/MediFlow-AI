import { config } from '../config/env.js';

const GEMINI_MODELS = ['gemini-3.5-flash'];
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Parses markdown section text into structured key-value sections
 */
function parseSectionsFromText(text) {
  const defaultSections = {
    patientOverview: 'Not documented in hospital records.',
    relevantMedicalHistory: 'Not documented in hospital records.',
    previousDiagnosesAndTreatments: 'Not documented in hospital records.',
    medicationsMentioned: 'Not documented in hospital records.',
    admissionHistory: 'Not documented in hospital records.',
    importantMissingInformation: 'Allergies, family history, and immunization status are not documented in hospital records.',
  };

  if (!text || typeof text !== 'string') {
    return defaultSections;
  }

  // Regex patterns to capture the required sections
  const patterns = [
    { key: 'patientOverview', regex: /##?\s*(?:1[.\s]*)?Patient Overview\s*[:\n]([\s\S]*?)(?=(?:##?\s*(?:2[.\s]*)?Relevant Medical History)|$)/i },
    { key: 'relevantMedicalHistory', regex: /##?\s*(?:2[.\s]*)?Relevant Medical History\s*[:\n]([\s\S]*?)(?=(?:##?\s*(?:3[.\s]*)?Previous Diagnoses)|$)/i },
    { key: 'previousDiagnosesAndTreatments', regex: /##?\s*(?:3[.\s]*)?Previous Diagnoses (?:and|&) Treatments\s*[:\n]([\s\S]*?)(?=(?:##?\s*(?:4[.\s]*)?Medications Mentioned)|$)/i },
    { key: 'medicationsMentioned', regex: /##?\s*(?:4[.\s]*)?Medications Mentioned (?:in Records)?\s*[:\n]([\s\S]*?)(?=(?:##?\s*(?:5[.\s]*)?Admission History)|$)/i },
    { key: 'admissionHistory', regex: /##?\s*(?:5[.\s]*)?Admission History\s*[:\n]([\s\S]*?)(?=(?:##?\s*(?:6[.\s]*)?Important Missing Information)|$)/i },
    { key: 'importantMissingInformation', regex: /##?\s*(?:6[.\s]*)?Important Missing Information\s*[:\n]([\s\S]*?)$/i },
  ];

  const extracted = { ...defaultSections };
  let foundAny = false;

  for (const item of patterns) {
    const match = text.match(item.regex);
    if (match && match[1] && match[1].trim()) {
      extracted[item.key] = match[1].trim();
      foundAny = true;
    }
  }

  if (!foundAny) {
    // If headers weren't strictly formatted, provide the raw text under medical history
    extracted.relevantMedicalHistory = text.trim();
  }

  return extracted;
}

/**
 * Builds deterministic grounded summary directly from documented records (used when AI is unconfigured or fallback)
 */
export function buildGroundedFallbackSummary(patient, records = [], admissions = []) {
  // 1. Patient Overview
  const overview = `Patient Name: ${patient.name || 'Not documented'}\nEmail: ${patient.email || 'Not documented'}\nTotal Documented Encounters: ${records.length} clinical record(s), ${admissions.length} inpatient admission(s).`;

  // 2. Relevant Medical History
  let history = 'No historical consultation or diagnostic records documented.';
  if (records.length > 0) {
    history = records
      .map(
        (r) =>
          `• [${new Date(r.recordDate).toLocaleDateString()}] ${r.title} (${r.recordType.toUpperCase()}): ${
            r.description || r.notes || 'No extended description recorded'
          }`
      )
      .join('\n');
  }

  // 3. Diagnoses and Treatments
  const dxList = records.filter((r) => r.diagnosis || r.treatment);
  let dxText = 'No prior clinical diagnoses or treatments documented in records.';
  if (dxList.length > 0) {
    dxText = dxList
      .map(
        (r) =>
          `• [${new Date(r.recordDate).toLocaleDateString()}] Diagnosis: ${r.diagnosis || 'None specified'} | Treatment: ${
            r.treatment || 'None specified'
          }`
      )
      .join('\n');
  }

  // 4. Medications
  const rxList = [];
  records.forEach((r) => {
    (r.prescriptions || []).forEach((rx) => {
      rxList.push(
        `• ${rx.medicationName} — Dose: ${rx.dosage}, Frequency: ${rx.frequency}, Duration: ${rx.duration}${
          rx.instructions ? ` (Instructions: ${rx.instructions})` : ''
        } [Prescribed: ${new Date(r.recordDate).toLocaleDateString()}]`
      );
    });
  });
  const medText = rxList.length > 0 ? rxList.join('\n') : 'No medications documented in hospital records.';

  // 5. Admissions
  let admText = 'No hospital inpatient admissions documented.';
  if (admissions.length > 0) {
    admText = admissions
      .map(
        (a) =>
          `• [Admitted: ${new Date(a.admissionDate).toLocaleDateString()} | Status: ${a.status.toUpperCase()}] Bed: ${
            a.bedNumber
          } | Reason: ${a.admissionReason}${
            a.dischargeDate
              ? ` | Discharged: ${new Date(a.dischargeDate).toLocaleDateString()} — Summary: ${a.dischargeSummary || 'None'}`
              : ' (Currently active admission)'
          }`
      )
      .join('\n');
  }

  // 6. Missing Information
  const missing = [
    'Known drug or food allergies: Not documented in hospital records.',
    'Immunization and vaccination history: Not documented.',
    'Family medical history: Not documented.',
    'Social and lifestyle risk factors (smoking, alcohol, occupational hazards): Not documented.',
  ].join('\n• ');

  const sections = {
    patientOverview: overview,
    relevantMedicalHistory: history,
    previousDiagnosesAndTreatments: dxText,
    medicationsMentioned: medText,
    admissionHistory: admText,
    importantMissingInformation: `• ${missing}`,
  };

  const rawText = `## 1. Patient Overview\n${overview}\n\n## 2. Relevant Medical History\n${history}\n\n## 3. Previous Diagnoses and Treatments\n${dxText}\n\n## 4. Medications Mentioned in Records\n${medText}\n\n## 5. Admission History\n${admText}\n\n## 6. Important Missing Information\n• ${missing}`;

  return {
    sections,
    rawText,
    isFallback: true,
  };
}

/**
 * Generates an AI-powered summary using Google Gemini API grounded in patient records
 */
export async function generatePatientHistorySummary(patient, records = [], admissions = [], options = {}) {
  // If patient has zero documented records and zero admissions, return grounded empty baseline
  if (records.length === 0 && admissions.length === 0) {
    const baseline = buildGroundedFallbackSummary(patient, [], []);
    return {
      sections: baseline.sections,
      rawText: baseline.rawText,
      modelUsed: 'grounded-baseline',
      isFallback: false,
    };
  }

  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    // Missing AI configuration: return structured grounded fallback
    const fallback = buildGroundedFallbackSummary(patient, records, admissions);
    return {
      sections: fallback.sections,
      rawText: fallback.rawText,
      modelUsed: 'grounded-fallback',
      isFallback: true,
    };
  }

  // Prepare grounded clinical context payload for AI prompt
  const serializedRecords = records.map((r, idx) => ({
    recordId: r._id?.toString() || `REC-${idx + 1}`,
    date: r.recordDate ? new Date(r.recordDate).toISOString().slice(0, 10) : 'Unknown date',
    type: r.recordType,
    title: r.title,
    diagnosis: r.diagnosis || 'None recorded',
    symptoms: r.symptoms || [],
    treatment: r.treatment || 'None recorded',
    prescriptions: (r.prescriptions || []).map((p) => ({
      name: p.medicationName,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      instructions: p.instructions,
    })),
    vitals: r.vitals || null,
    notes: r.notes || '',
  }));

  const serializedAdmissions = admissions.map((a, idx) => ({
    admissionId: a._id?.toString() || `ADM-${idx + 1}`,
    admissionDate: a.admissionDate ? new Date(a.admissionDate).toISOString().slice(0, 10) : 'Unknown date',
    status: a.status,
    bedNumber: a.bedNumber,
    department: a.department?.name || 'Inpatient Unit',
    admissionReason: a.admissionReason,
    dischargeDate: a.dischargeDate ? new Date(a.dischargeDate).toISOString().slice(0, 10) : null,
    dischargeSummary: a.dischargeSummary || 'None recorded',
    treatmentSummary: a.treatmentSummary || 'None recorded',
  }));

  const prompt = `You are a clinical documentation assistant for the MediFlow-AI Hospital Management System.
Generate a concise, clinically rigorous patient history summary for an attending physician based ONLY on the documented hospital records below.

CRITICAL INSTRUCTIONS:
1. Do NOT invent, assume, or fabricate any diagnoses, medications, dosages, symptoms, allergies, or dates.
2. If any category or field is not documented in the provided records, explicitly state: "Not documented in hospital records."
3. Every fact must be grounded in the provided records. Reference relevant dates where practical.
4. Format your response into EXACTLY these six markdown sections with these exact headers:

## 1. Patient Overview
## 2. Relevant Medical History
## 3. Previous Diagnoses and Treatments
## 4. Medications Mentioned in Records
## 5. Admission History
## 6. Important Missing Information

---
PATIENT DETAILS:
- Name: ${patient.name || 'Unknown'}
- System ID: ${patient._id || 'Unknown'}

DOCUMENTED MEDICAL RECORDS (${serializedRecords.length}):
${JSON.stringify(serializedRecords, null, 2)}

DOCUMENTED INPATIENT ADMISSIONS (${serializedAdmissions.length}):
${JSON.stringify(serializedAdmissions, null, 2)}
---`;

  const timeoutMs = options.timeoutMs || 25000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let lastError = null;

  try {
    for (const model of GEMINI_MODELS) {
      try {
        const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.1, // Low temperature for high factual adherence
              maxOutputTokens: 4000,
              thinkingConfig: {
                thinkingBudget: 0,
              },
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          lastError = new Error(`Gemini API returned status ${response.status} for ${model}: ${errorText.slice(0, 150)}`);
          continue; // Try next candidate model if available
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const generatedText = candidate?.content?.parts?.[0]?.text;

        if (!generatedText) {
          lastError = new Error(`Gemini API returned empty response candidates for ${model}`);
          continue;
        }

        clearTimeout(timer);
        const sections = parseSectionsFromText(generatedText);

        return {
          sections,
          rawText: generatedText,
          modelUsed: model,
          isFallback: false,
        };
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error(`AI summary service request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
        }
        lastError = err;
      }
    }

    clearTimeout(timer);
    // If upstream provider exhausted quota (HTTP 429) or unavailable, fail gracefully to grounded fallback
    if (lastError && (lastError.message.includes('429') || lastError.message.includes('quota') || lastError.message.includes('RESOURCE_EXHAUSTED'))) {
      const fallback = buildGroundedFallbackSummary(patient, records, admissions);
      return {
        sections: fallback.sections,
        rawText: fallback.rawText,
        modelUsed: 'grounded-records-engine',
        isFallback: true,
      };
    }
    throw lastError || new Error('All AI model candidate requests failed.');
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError' || error.message.includes('timed out')) {
      throw new Error(`AI summary service request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      const fallback = buildGroundedFallbackSummary(patient, records, admissions);
      return {
        sections: fallback.sections,
        rawText: fallback.rawText,
        modelUsed: 'grounded-records-engine',
        isFallback: true,
      };
    }
    // Re-throw with sanitized message (no keys exposed)
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

export default {
  generatePatientHistorySummary,
  buildGroundedFallbackSummary,
};
