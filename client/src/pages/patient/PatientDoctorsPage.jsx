import React from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import { Stethoscope, Search } from 'lucide-react';

export default function PatientDoctorsPage() {
  const sampleDoctors = [
    { name: 'Dr. Sarah Connor', dept: 'Cardiology', qualification: 'MD, FACC', fee: '₹700', experience: '12 yrs' },
    { name: 'Dr. Gregory House', dept: 'General Medicine', qualification: 'MBBS, MD', fee: '₹900', experience: '18 yrs' },
    { name: 'Dr. Meredith Grey', dept: 'General Surgery', qualification: 'MS (Surgery)', fee: '₹800', experience: '9 yrs' },
    { name: 'Dr. Stephen Strange', dept: 'Neurology', qualification: 'MD, PhD', fee: '₹1200', experience: '15 yrs' },
  ];

  return (
    <div>
      <PageHeader
        title="Hospital Medical Specialists"
        subtitle="Browse hospital doctors by clinical specialty, qualifications, and consultation fee"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sampleDoctors.map((doc, idx) => (
          <Card key={idx} className="hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
              {doc.dept}
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-1">{doc.name}</h4>
            <p className="text-xs text-slate-500">{doc.qualification} • {doc.experience}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Consultation:</span>
              <span className="font-bold text-slate-800">{doc.fee}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
