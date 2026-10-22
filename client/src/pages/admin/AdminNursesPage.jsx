import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { HeartHandshake, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminNursesPage() {
  return (
    <div>
      <PageHeader
        title="Nursing Staff Directory"
        subtitle="Manage nursing rotations, shift rosters, and ward allocations"
        action={
          <Link to="/admin/users">
            <Button icon={UserPlus} variant="primary">
              Provision Nurse
            </Button>
          </Link>
        }
      />

      <Card title="Nursing Roster" subtitle="Ward nursing staff and shift scheduling">
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Nursing Operations Standby (Phase 4)</h3>
          <p className="text-xs text-slate-500 max-w-md mt-1">
            Ward assignments, inpatient care charts, and medication administration records will be managed through the inpatient care module.
          </p>
        </div>
      </Card>
    </div>
  );
}
