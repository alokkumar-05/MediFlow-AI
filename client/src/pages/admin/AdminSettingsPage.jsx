import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Settings, Shield, KeyRound, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Administrative & Security Settings"
        subtitle="Configure hospital-wide policies, authentication lifetimes, and security controls"
      />

      <div className="space-y-6">
        <Card title="Role-Based Security Policy" subtitle="Active authorization enforcement">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Public Patient Registration</p>
                <p className="text-slate-400">Strictly enforces role='patient' on all public signups</p>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Enforced</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Staff Account Creation</p>
                <p className="text-slate-400">Restricted strictly to authenticated Administrators</p>
              </div>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Enforced</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Token Transport</p>
                <p className="text-slate-400">HTTP-Only secure cookie with sameSite protection</p>
              </div>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Active</span>
            </div>
          </div>
        </Card>

        <Card title="Initial Administrator Bootstrap Note" subtitle="Setup reference">
          <p className="text-xs text-slate-600 leading-relaxed">
            The initial administrator account was created using the safe one-time CLI script (<code className="font-mono text-slate-800">npm run seed:admin</code>). The bootstrap process guarantees that existing accounts are never overwritten.
          </p>
        </Card>
      </div>
    </div>
  );
}
