import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { Stethoscope, Plus, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDoctorsPage() {
  return (
    <div>
      <PageHeader
        title="Doctors Directory & Rostering"
        subtitle="Manage physician specializations, consultation hours, and department assignments"
        action={
          <Link to="/admin/users">
            <Button icon={UserPlus} variant="primary">
              Provision Doctor
            </Button>
          </Link>
        }
      />

      <Card title="Clinical Faculty" subtitle="Physician profiles and availability rules">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Doctor Profile Engine Ready for Phase 3</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Doctor availability scheduling, room allocations, consultation fee settings, and specialty tagging will be linked to the DoctorProfile schema in Phase 3.
          </p>
        </div>
      </Card>
    </div>
  );
}
