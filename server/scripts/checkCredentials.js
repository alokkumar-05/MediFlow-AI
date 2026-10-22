import dotenv from 'dotenv';
import mongoose from 'mongoose';
import https from 'https';

dotenv.config();

console.log('\n====================================================');
console.log('🧪 MediFlow-AI Service & Credential Diagnostic Test');
console.log('====================================================\n');

// 1. Test MongoDB Atlas
async function testMongoDB() {
  const uri = process.env.MONGODB_URI;
  console.log('1️⃣  Testing MongoDB Atlas...');
  if (!uri) {
    console.log('   ❌ MONGODB_URI is not set in server/.env\n');
    return { ok: false, error: 'URI not set' };
  }

  try {
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`   Connecting to: ${maskedUri}`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      dbName: 'mediflow'
    });

    const adminDb = mongoose.connection.db.admin();
    const pingResult = await adminDb.ping();
    const currentDb = mongoose.connection.db.databaseName;

    console.log('   ✅ MongoDB Atlas Connected Successfully!');
    console.log(`   📂 Database Name : ${currentDb}`);
    console.log(`   📡 Ping Response : ${JSON.stringify(pingResult)}\n`);
    await mongoose.disconnect();
    return { ok: true, database: currentDb };
  } catch (err) {
    console.log(`   ❌ MongoDB Connection Failed: ${err.message}\n`);
    return { ok: false, error: err.message };
  }
}

// 2. Test Cloudinary
async function testCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('2️⃣  Testing Cloudinary Media Credentials...');
  if (!cloudName || !apiKey || !apiSecret) {
    console.log('   ❌ Cloudinary credentials missing in server/.env\n');
    return { ok: false, error: 'Credentials missing' };
  }

  console.log(`   Cloud Name: ${cloudName}`);
  console.log(`   API Key   : ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

  return new Promise((resolve) => {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${cloudName}/ping`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.status === 'ok') {
            console.log('   ✅ Cloudinary Connected Successfully!');
            console.log(`   📡 Status: ${parsed.status}\n`);
            resolve({ ok: true, status: parsed.status });
          } else {
            console.log(`   ❌ Cloudinary Auth Failed (HTTP ${res.statusCode}): ${data}\n`);
            resolve({ ok: false, error: data, statusCode: res.statusCode });
          }
        } catch (e) {
          console.log(`   ❌ Cloudinary Parse Error (HTTP ${res.statusCode}): ${data}\n`);
          resolve({ ok: false, error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Cloudinary Network Request Failed: ${e.message}\n`);
      resolve({ ok: false, error: e.message });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      console.log('   ❌ Cloudinary Request Timed Out (8s)\n');
      resolve({ ok: false, error: 'Timeout' });
    });

    req.end();
  });
}

// 3. Test Google Gemini API Key
async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('3️⃣  Testing Google Gemini AI API Key...');
  if (!apiKey) {
    console.log('   ❌ GEMINI_API_KEY is not set in server/.env\n');
    return { ok: false, error: 'Key not set' };
  }

  const maskedKey = apiKey.length > 8 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` 
    : '****';
  console.log(`   API Key: ${maskedKey}`);

  return new Promise((resolve) => {
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
            const geminiModels = parsed.models
              .map(m => m.name.replace('models/', ''))
              .filter(m => m.includes('gemini'))
              .slice(0, 3);
            console.log('   ✅ Gemini API Key Validated Successfully!');
            console.log(`   🤖 Available Gemini Models (Sample): ${geminiModels.join(', ')}\n`);
            resolve({ ok: true, models: geminiModels });
          } else {
            console.log(`   ❌ Gemini API Error (HTTP ${res.statusCode}):`);
            if (parsed.error) {
              console.log(`      Code    : ${parsed.error.code}`);
              console.log(`      Message : ${parsed.error.message}`);
              console.log(`      Status  : ${parsed.error.status}\n`);
            } else {
              console.log(`      Response: ${data}\n`);
            }
            resolve({ ok: false, statusCode: res.statusCode, error: parsed.error || data });
          }
        } catch (e) {
          console.log(`   ❌ Gemini Parse Error (HTTP ${res.statusCode}): ${data}\n`);
          resolve({ ok: false, statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Gemini Network Request Failed: ${e.message}\n`);
      resolve({ ok: false, error: e.message });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      console.log('   ❌ Gemini Request Timed Out (8s)\n');
      resolve({ ok: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function runAll() {
  const mongo = await testMongoDB();
  const cloud = await testCloudinary();
  const gemini = await testGemini();

  console.log('====================================================');
  console.log('📊 Diagnostic Summary');
  console.log('====================================================');
  console.log(`MongoDB Atlas   : ${mongo.ok ? '🟢 ACTIVE & WORKING' : '🔴 FAILED'}`);
  console.log(`Cloudinary Media: ${cloud.ok ? '🟢 ACTIVE & WORKING' : '🔴 FAILED'}`);
  console.log(`Google Gemini AI: ${gemini.ok ? '🟢 ACTIVE & WORKING' : '🔴 FAILED'}`);
  console.log('====================================================\n');
}

runAll().then(() => process.exit(0));
