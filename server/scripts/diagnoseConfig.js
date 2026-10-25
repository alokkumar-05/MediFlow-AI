import { config } from '../src/config/env.js';
import https from 'https';

const apiKey = config.geminiApiKey;
const model = 'gemini-3.5-flash-lite';

async function testBody(label, bodyObj) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(bodyObj);
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
        console.log(`[${label}] Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          console.log(`   Error: ${data.slice(0, 200)}`);
        } else {
          console.log(`   Success: ${data.slice(0, 100)}...`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`[${label}] Request error:`, e.message);
      resolve();
    });
    req.write(postData);
    req.end();
  });
}

async function run() {
  // Test 1: with thinkingConfig { thinkingBudget: 0 }
  await testBody('With thinkingConfig', {
    contents: [{ parts: [{ text: 'Say hello' }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 100,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  // Test 2: without thinkingConfig
  await testBody('Without thinkingConfig', {
    contents: [{ parts: [{ text: 'Say hello' }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 100
    }
  });

  // Test 3: without thinkingConfig and with responseMimeType
  await testBody('With responseMimeType only', {
    contents: [{ parts: [{ text: '{"message": "hello"}' }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 100,
      responseMimeType: 'application/json'
    }
  });
}

run();
