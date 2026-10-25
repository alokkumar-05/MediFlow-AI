import { config } from '../src/config/env.js';
import https from 'https';

console.log('Querying available Gemini models for API key...');

const apiKey = config.geminiApiKey;
const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200 && parsed.models) {
        console.log('STATUS: 200 OK');
        const models = parsed.models.map(m => ({
          name: m.name.replace('models/', ''),
          displayName: m.displayName,
          supportedGenerationMethods: m.supportedGenerationMethods,
        }));
        console.log('Available Models:', JSON.stringify(models, null, 2));
      } else {
        console.log(`STATUS: ${res.statusCode}`);
        console.log('Error Body:', data);
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
});

req.on('error', (err) => {
  console.log('Request error:', err.message);
});

req.end();
