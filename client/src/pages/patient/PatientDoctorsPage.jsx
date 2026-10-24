import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Stethoscope,
  Search,
  Building2,
  Calendar,
  Clock,
  Award,
  DollarSign,
  ChevronRight,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';

export default function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Fetch Public Doctors Directory
  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedDept) params.append('department', selectedDept);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/doctors?${params.toString()}`);
      if (res.data?.success) {
        setDoctors(res.data.doctors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors directory.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Department List for Filter
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.warn('Could not load departments list:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [selectedDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Medical Faculty & Specialists"
        subtitle="Browse credentialed physicians by specialty, clinical experience, consulting hours, and fees"
      />

      {/* Filter and Search Header */}
      <Card>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search specialists by name, medical specialty, or clinical field..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Clinical Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchDoctors}
              className="shrink-0"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading medical specialists...</p>
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Specialists Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery || selectedDept
                ? 'No doctors match the selected search or department filter. Try clearing your filters.'
                : 'There are currently no active doctors rostered in this department.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => {
            const activeDays = doc.schedule?.map((s) => s.day) || [];

            return (
              <div
                key={doc._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
                      {doc.name?.charAt(0) || 'D'}
                    </div>
                    {doc.department && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50/80 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {doc.department.name}
                      </span>
                    )}
                  </div>

                  {/* Doctor Title & Specialization */}
                  <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">
                    {doc.specialization}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {doc.qualification} • {doc.experienceYears} yrs clinical exp.
                  </div>

                  {/* Bio */}
                  {doc.bio && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {doc.bio}
                    </p>
                  )}

                  {/* Consultation Details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Building2 className="w-3.5 h-3.5" />
                        Room / Cabin
                      </span>
                      <span className="font-medium text-slate-800">{doc.roomNumber || 'Consultation Suite'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        Slot Duration
                      </span>
                      <span className="font-medium text-slate-800">{doc.slotDuration} mins</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <DollarSign className="w-3.5 h-3.5" />
                        Consultation Fee
                      </span>
                      <span className="font-bold text-slate-900 text-sm">₹{doc.consultationFee}</span>
                    </div>
                  </div>

                  {/* Roster Days Pills */}
                  {activeDays.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Consulting Days
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeDays.map((d) => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded capitalize"
                          >
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available for Consultation
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCTOR DETAILS MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {selectedDoctor.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedDoctor.name}</h3>
                  <p className="text-xs text-blue-600 font-medium">{selectedDoctor.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="font-semibold text-slate-700 mb-1">Clinical Department & Location</div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600 flex items-center justify-between">
                  <span>{selectedDoctor.department?.name || 'Department'}</span>
                  <span className="text-slate-400">{selectedDoctor.roomNumber || 'Consultation Suite'}</span>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Qualifications & Experience</div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                  <p className="font-medium text-slate-800">{selectedDoctor.qualification}</p>
                  <p className="text-slate-500 mt-0.5">{selectedDoctor.experienceYears} Years of Active Medical Practice</p>
                </div>
              </div>

              {selectedDoctor.bio && (
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Physician Overview</div>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-600 leading-relaxed">
                    {selectedDoctor.bio}
                  </p>
                </div>
              )}

              {/* Consultation Working Hours Schedule */}
              <div>
                <div className="font-semibold text-slate-700 mb-2">Weekly Outpatient Consultation Hours</div>
                {selectedDoctor.schedule && selectedDoctor.schedule.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDoctor.schedule.map((shift) => (
                      <div
                        key={shift.day}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
                      >
                        <span className="font-semibold capitalize text-slate-800">{shift.day}</span>
                        <div className="text-slate-600">
                          <span>{shift.startTime} - {shift.endTime}</span>
                          {shift.breakStart && shift.breakEnd && (
                            <span className="text-slate-400 text-[10px] ml-2">
                              (Break: {shift.breakStart} - {shift.breakEnd})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-400 italic">
                    Weekly hours scheduled by appointment only.
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-blue-700 uppercase font-semibold">Standard Consultation Fee</div>
                  <div className="text-base font-bold text-blue-900">₹{selectedDoctor.consultationFee}</div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Slot: {selectedDoctor.slotDuration} minutes
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoctor(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
