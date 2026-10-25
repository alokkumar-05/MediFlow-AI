import { config } from '../src/config/env.js';
import https from 'https';

const apiKey = config.geminiApiKey;
const candidateModels = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
];

async function testModel(model) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: 'Respond with exactly: "OK"' }] }],
      generationConfig: { maxOutputTokens: 10 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        resolve({ model, status: res.statusCode, body: data });
      });
    });

    req.on('error', (e) => resolve({ model, error: e.message }));
    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const m of candidateModels) {
    const res = await testModel(m);
    console.log(`Model: ${m} => Status: ${res.status || 'ERR'}`);
    if (res.status === 200) {
      console.log(`🎉 MODEL ${m} WORKS!`);
      break;
    } else {
      try {
        const parsed = JSON.parse(res.body);
        console.log(`   Message: ${parsed.error?.message?.slice(0, 120)}`);
      } catch (e) {
        console.log(`   Body: ${res.body?.slice(0, 100)}`);
      }
    }
  }
}

run();
