import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Settings, Shield, Bell } from 'lucide-react';

export default function NurseSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Nursing Station Settings"
        subtitle="Manage assigned ward preferences, shift alerts, and emergency contact lists"
      />

      <Card title="Ward & Station Preferences" subtitle="Station configuration">
        <p className="text-xs text-slate-500">
          Ward alert notifications and critical patient threshold preferences will be configurable in the inpatient care module.
        </p>
      </Card>
    </div>
  );
}
