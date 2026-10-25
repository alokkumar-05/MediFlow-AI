import { config } from '../src/config/env.js';
import { analyzeMedicalReport } from '../src/services/geminiService.js';

async function testSingleCall() {
  const MOCK_LAB_REPORT_TEXT = `
METROPOLITAN HOSPITAL LABORATORY
Patient: Test Patient
Date of Report: 2026-10-15
Test: Comprehensive Metabolic Panel (CMP)

TEST PARAMETERS:
- Fasting Blood Glucose: 145 mg/dL (Reference Range: 70 - 99 mg/dL) [HIGH]
- Hemoglobin A1c: 7.2 % (Reference Range: 4.0 - 5.6 %) [HIGH]
- Serum Creatinine: 0.9 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) [NORMAL]
`;

  try {
    console.log('Sending test request directly to analyzeMedicalReport...');
    const res = await analyzeMedicalReport({
      mimeType: 'text/plain',
      textContent: MOCK_LAB_REPORT_TEXT,
    });
    console.log('SUCCESS!');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('FAILED WITH ERROR:', err.message);
  }
}

testSingleCall();
