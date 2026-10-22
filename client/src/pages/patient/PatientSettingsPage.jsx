import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Settings, Lock, Bell, Shield } from 'lucide-react';

export default function PatientSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Patient Account Settings"
        subtitle="Manage login security, notification preferences, and privacy controls"
      />

      <div className="space-y-6">
        <Card title="Security & Password" subtitle="Account access security">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Password Encryption</p>
                <p className="text-slate-400">Secured via bcrypt with 10 salt rounds</p>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Session Cookie</p>
                <p className="text-slate-400">Stored in HTTP-only cookie to prevent script injection (XSS)</p>
              </div>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Enforced</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
