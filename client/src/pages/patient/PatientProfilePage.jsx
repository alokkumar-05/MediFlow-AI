import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { User, Mail, Shield, Heart, Phone, AlertCircle } from 'lucide-react';

export default function PatientProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Personal Health Profile"
        subtitle="Manage personal demographics, blood group, allergies, and emergency contacts"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Account Information" subtitle="Login credentials" className="lg:col-span-1">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-3">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'PT'}
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{user?.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <span className="mt-2 text-[10px] font-semibold uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Verified Patient
            </span>
          </div>

          <div className="pt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Account Status:</span>
              <span className="text-emerald-600 font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Member Since:</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</span>
            </div>
          </div>
        </Card>

        <Card title="Clinical Profile" subtitle="Patient electronic health record summary" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Blood Group</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">O+ Positive (Sample)</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Known Drug Allergies</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">Penicillin (Sample)</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Emergency Contact</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">Jane Doe (Spouse) • +91 98765 43210</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Chronic Conditions</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">None reported (Sample)</p>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50/70 rounded-xl text-xs text-blue-800 border border-blue-200/60 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>
              Clinical profiles maintain verified emergency contacts, blood group, and allergy histories for medical consultations.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
