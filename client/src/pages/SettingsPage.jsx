import React from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { Settings, Shield, Bell, Database, Info } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Manage hospital configuration, security preferences, and integration settings"
      />

      <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">System Preferences Scaffold (Phase 1)</p>
          <p className="text-blue-700/90 text-xs mt-0.5">
            Role permission auditing, security keys, notification preferences, and backup controls will be connected to the administrator control plane.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card title="Security & Authentication Settings" subtitle="JWT session and password policies">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Role-Based Access Control (RBAC)</p>
                <p className="text-xs text-slate-400">Enforce route and resource authorization for Admin, Doctor, Nurse, and Patient</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Active in Schema
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">JWT Token Expiration</p>
                <p className="text-xs text-slate-400">Configured default session lifespan</p>
              </div>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                7 Days (Configurable)
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">CORS Protection</p>
                <p className="text-xs text-slate-400">Strict origin allowance via environment variable</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                Enabled
              </span>
            </div>
          </div>
        </Card>

        <Card title="Integration Diagnostics" subtitle="Third-party service connectivity preview">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-700">MongoDB Atlas</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Mongoose decoupled driver</p>
              <span className="inline-block mt-2 text-[10px] font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Credential Standby
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-700">MediFlow-AI Engine</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Assistive clinical intelligence</p>
              <span className="inline-block mt-2 text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Phase 5 Target
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-700">Cloudinary Media</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Medical report storage</p>
              <span className="inline-block mt-2 text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                Phase 4 Target
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
