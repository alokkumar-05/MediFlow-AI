import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Edit2,
  Clock,
  Calendar,
  Building2,
  DollarSign,
  User,
  Power,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [eligibleStaff, setEligibleStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [scheduleModalDoctor, setScheduleModalDoctor] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    userId: '',
    departmentId: '',
    specialization: '',
    qualification: '',
    experienceYears: 0,
    consultationFee: 500,
    bio: '',
    roomNumber: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Schedule Modal State
  const [scheduleData, setScheduleData] = useState({
    slotDuration: 30,
    timeZone: 'UTC',
    isAcceptingAppointments: true,
    schedule: [],
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Fetch doctors list
  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (departmentFilter) params.append('department', departmentFilter);
      if (availabilityFilter !== '') params.append('isAvailable', availabilityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/admin/doctors?${params.toString()}`);
      if (res.data?.success) {
        setDoctors(res.data.doctors || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctor profiles.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active departments
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments?isActive=true');
      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.warn('Could not fetch departments:', err);
    }
  };

  // Fetch staff users with role=doctor
  const fetchEligibleStaff = async () => {
    try {
      const res = await api.get('/admin/staff?role=doctor');
      if (res.data?.success) {
        setEligibleStaff(res.data.staff || []);
      }
    } catch (err) {
      console.warn('Could not fetch doctor staff list:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEligibleStaff();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [departmentFilter, availabilityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  // Toggle Doctor Active Availability
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/admin/doctors/${id}/toggle-status`);
      if (res.data?.success) {
        setSuccessMessage(`Doctor availability ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchDoctors();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle doctor availability.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Open Create Profile Modal
  const openCreateModal = () => {
    setFormData({
      userId: '',
      departmentId: '',
      specialization: '',
      qualification: '',
      experienceYears: 0,
      consultationFee: 500,
      bio: '',
      roomNumber: '',
    });
    setFormError('');
    setShowCreateModal(true);
  };

  // Submit Create Profile
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        userId: formData.userId,
        departmentId: formData.departmentId || null,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        consultationFee: Number(formData.consultationFee),
        bio: formData.bio,
        roomNumber: formData.roomNumber,
      };

      const res = await api.post('/admin/doctors', payload);
      if (res.data?.success) {
        setSuccessMessage('Doctor clinical profile created successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setShowCreateModal(false);
        fetchDoctors();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create doctor profile.');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Profile Modal
  const openEditModal = (doc) => {
    setEditingDoctor(doc);
    setFormData({
      departmentId: doc.department?._id || '',
      specialization: doc.specialization || '',
      qualification: doc.qualification || '',
      experienceYears: doc.experienceYears || 0,
      consultationFee: doc.consultationFee || 500,
      bio: doc.bio || '',
      roomNumber: doc.roomNumber || '',
    });
    setFormError('');
  };

  // Submit Edit Profile
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        departmentId: formData.departmentId || null,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        consultationFee: Number(formData.consultationFee),
        bio: formData.bio,
        roomNumber: formData.roomNumber,
      };

      const res = await api.put(`/admin/doctors/${editingDoctor._id}`, payload);
      if (res.data?.success) {
        setSuccessMessage('Doctor profile updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setEditingDoctor(null);
        fetchDoctors();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update doctor profile.');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Schedule Modal
  const openScheduleModal = (doc) => {
    setScheduleModalDoctor(doc);
    setScheduleError('');
    const existingAvail = doc.availability || {};
    const defaultSchedule = [
      { day: 'monday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      { day: 'thursday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      { day: 'friday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
      { day: 'saturday', startTime: '10:00', endTime: '13:00', breakStart: '', breakEnd: '', isActive: false },
      { day: 'sunday', startTime: '10:00', endTime: '13:00', breakStart: '', breakEnd: '', isActive: false },
    ];

    let initialSchedule = defaultSchedule;
    if (existingAvail.schedule && existingAvail.schedule.length > 0) {
      initialSchedule = DAYS_OF_WEEK.map((d) => {
        const found = existingAvail.schedule.find((s) => s.day.toLowerCase() === d);
        if (found) {
          return {
            day: d,
            startTime: found.startTime || '09:00',
            endTime: found.endTime || '17:00',
            breakStart: found.breakStart || '',
            breakEnd: found.breakEnd || '',
            isActive: found.isActive !== false,
          };
        }
        return {
          day: d,
          startTime: '09:00',
          endTime: '17:00',
          breakStart: '13:00',
          breakEnd: '14:00',
          isActive: false,
        };
      });
    }

    setScheduleData({
      slotDuration: existingAvail.slotDuration || 30,
      timeZone: existingAvail.timeZone || 'UTC',
      isAcceptingAppointments: existingAvail.isAcceptingAppointments !== false,
      schedule: initialSchedule,
    });
  };

  // Update a single day schedule in modal
  const handleScheduleDayChange = (dayIndex, field, value) => {
    setScheduleData((prev) => {
      const nextSchedule = [...prev.schedule];
      nextSchedule[dayIndex] = {
        ...nextSchedule[dayIndex],
        [field]: value,
      };
      return { ...prev, schedule: nextSchedule };
    });
  };

  // Submit Schedule
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleModalDoctor) return;
    setScheduleLoading(true);
    setScheduleError('');

    try {
      const payload = {
        slotDuration: Number(scheduleData.slotDuration),
        timeZone: scheduleData.timeZone,
        isAcceptingAppointments: scheduleData.isAcceptingAppointments,
        schedule: scheduleData.schedule.filter((s) => s.isActive),
      };

      const res = await api.put(`/admin/doctors/${scheduleModalDoctor._id}/availability`, payload);
      if (res.data?.success) {
        setSuccessMessage('Doctor weekly consultation schedule updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setScheduleModalDoctor(null);
        fetchDoctors();
      }
    } catch (err) {
      setScheduleError(err.response?.data?.message || 'Failed to save availability schedule.');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Find staff users without doctor profile for selection
  const assignedUserIds = new Set(doctors.map((d) => d.user?._id));
  const availableDoctorsToAssign = eligibleStaff.filter((st) => !assignedUserIds.has(st._id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors Directory & Rostering"
        subtitle="Manage clinical faculty specializations, consultation hours, cabin rooms, and department assignments"
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/users">
              <Button variant="outline" size="sm">
                Provision Doctor User
              </Button>
            </Link>
            <Button icon={Plus} variant="primary" size="sm" onClick={openCreateModal}>
              Create Doctor Profile
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by doctor name, email, specialty, room, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Availability</option>
              <option value="true">Active Only</option>
              <option value="false">Unavailable</option>
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

      {/* Doctor Profiles List */}
      <Card
        title={`Clinical Faculty Profiles (${doctors.length})`}
        subtitle="Active physician accounts rostered for outpatient consultations and clinical duty"
      >
        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading doctor profiles...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Doctor Profiles Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {searchQuery || departmentFilter || availabilityFilter
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating a clinical profile for an existing doctor user.'}
            </p>
            <Button icon={Plus} size="sm" onClick={openCreateModal}>
              Create Doctor Profile
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Physician</th>
                  <th className="py-3 px-4">Department & Specialty</th>
                  <th className="py-3 px-4">Room & Fee</th>
                  <th className="py-3 px-4">Experience & Degree</th>
                  <th className="py-3 px-4">Rostering Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => {
                  const activeScheduleCount =
                    doc.availability?.schedule?.filter((s) => s.isActive)?.length || 0;

                  return (
                    <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {doc.user?.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                              {doc.user?.name || 'Unknown User'}
                              {!doc.user?.isActive && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-normal">
                                  User Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{doc.user?.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {doc.specialization}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {doc.department ? (
                            <span>{doc.department.name} ({doc.department.code})</span>
                          ) : (
                            <span className="text-amber-600 italic">No department assigned</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-0.5">
                          ₹{doc.consultationFee}
                          <span className="text-[10px] font-normal text-slate-400">/visit</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {doc.roomNumber || 'No Cabin Assigned'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {doc.qualification}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {doc.experienceYears} yrs clinical exp.
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-max ${
                              doc.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                doc.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {doc.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {activeScheduleCount} working days configured ({doc.availability?.slotDuration || 30}m slots)
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openScheduleModal(doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manage Availability Schedule"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(doc)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Doctor Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(doc._id, doc.isAvailable)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              doc.isAvailable
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={doc.isAvailable ? 'Set Unavailable' : 'Set Available'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE DOCTOR PROFILE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Provision Doctor Profile</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Doctor User Account *
                </label>
                {availableDoctorsToAssign.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span>All existing doctor accounts already have clinical profiles.</span>
                      <Link to="/admin/users" className="block text-blue-600 font-semibold underline mt-1">
                        Go to Staff Management to create a new Doctor account first.
                      </Link>
                    </div>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Choose Doctor User --</option>
                    {availableDoctorsToAssign.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Assignment
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">No Department (Initial Unassigned)</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Interventional Cardiology"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualifications & Degrees *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, MD, DM, FACC"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cabin / Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cabin 204, East Wing"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physician Bio / Overview
                </label>
                <textarea
                  rows="3"
                  placeholder="Summary of medical background, treatment focus, and clinical accomplishments..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={formLoading}
                  disabled={availableDoctorsToAssign.length === 0 || !formData.userId}
                >
                  Create Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR PROFILE MODAL */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Doctor: {editingDoctor.user?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{editingDoctor.user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Assignment
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">No Department (Unassigned)</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualification *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cabin / Room Number
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bio / Summary
                </label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDoctor(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={formLoading}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE & AVAILABILITY MODAL */}
      {scheduleModalDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Weekly Consultation Schedule: {scheduleModalDoctor.user?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configure day shifts, break intervals, and consultation slot duration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {scheduleError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Slot Duration (Minutes)
                  </label>
                  <select
                    value={scheduleData.slotDuration}
                    onChange={(e) => setScheduleData({ ...scheduleData, slotDuration: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes (Standard)</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    value={scheduleData.timeZone}
                    onChange={(e) => setScheduleData({ ...scheduleData, timeZone: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={scheduleData.isAcceptingAppointments}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, isAcceptingAppointments: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Accept Bookings</span>
                  </label>
                </div>
              </div>

              {/* Weekly Day Schedule Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>Day & Working Hours (24-Hour Format HH:mm)</span>
                  <span className="text-slate-400 font-normal text-[11px]">Break Interval (Optional)</span>
                </div>

                <div className="space-y-2">
                  {scheduleData.schedule.map((entry, idx) => (
                    <div
                      key={entry.day}
                      className={`p-3 rounded-xl border transition-colors ${
                        entry.isActive
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50/70 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-36">
                          <input
                            type="checkbox"
                            checked={entry.isActive}
                            onChange={(e) => handleScheduleDayChange(idx, 'isActive', e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-xs font-bold capitalize text-slate-800">
                            {entry.day}
                          </span>
                        </div>

                        {entry.isActive ? (
                          <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-slate-400 text-[10px]">Shift:</span>
                              <input
                                type="time"
                                value={entry.startTime}
                                onChange={(e) => handleScheduleDayChange(idx, 'startTime', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                              <span className="text-slate-400">to</span>
                              <input
                                type="time"
                                value={entry.endTime}
                                onChange={(e) => handleScheduleDayChange(idx, 'endTime', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-1 text-xs md:ml-auto">
                              <span className="text-slate-400 text-[10px]">Break:</span>
                              <input
                                type="time"
                                value={entry.breakStart}
                                onChange={(e) => handleScheduleDayChange(idx, 'breakStart', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                type="time"
                                value={entry.breakEnd}
                                onChange={(e) => handleScheduleDayChange(idx, 'breakEnd', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">Off Duty / Closed</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleModalDoctor(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={scheduleLoading}
                >
                  Save Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
