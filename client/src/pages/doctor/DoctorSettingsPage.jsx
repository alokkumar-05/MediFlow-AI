import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import api from '../../services/api.js';
import {
  Stethoscope,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Save,
  Power,
  RefreshCw,
  User,
  ShieldCheck
} from 'lucide-react';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DoctorSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Practice Profile Form Data
  const [profileData, setProfileData] = useState({
    specialization: '',
    qualification: '',
    experienceYears: 0,
    consultationFee: 500,
    roomNumber: '',
    bio: '',
  });

  // Availability Schedule Form Data
  const [availabilityData, setAvailabilityData] = useState({
    slotDuration: 30,
    timeZone: 'UTC',
    isAcceptingAppointments: true,
    schedule: [],
  });

  // Load Doctor Self Profile
  const fetchMyProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/doctor/profile');
      if (res.data?.success) {
        setProfileExists(res.data.profileExists);
        if (res.data.doctor) {
          const doc = res.data.doctor;
          setProfile(doc);
          setProfileData({
            specialization: doc.specialization || '',
            qualification: doc.qualification || '',
            experienceYears: doc.experienceYears || 0,
            consultationFee: doc.consultationFee || 500,
            roomNumber: doc.roomNumber || '',
            bio: doc.bio || '',
          });

          // Availability
          const avail = doc.availability || {};
          const defaultSchedule = [
            { day: 'monday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'tuesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'wednesday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'thursday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'friday', startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'saturday', startTime: '10:00', endTime: '13:00', breakStart: '', breakEnd: '', isActive: false },
            { day: 'sunday', startTime: '10:00', endTime: '13:00', breakStart: '', breakEnd: '', isActive: false },
          ];

          let mergedSchedule = defaultSchedule;
          if (avail.schedule && avail.schedule.length > 0) {
            mergedSchedule = DAYS_OF_WEEK.map((d) => {
              const found = avail.schedule.find((s) => s.day.toLowerCase() === d);
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

          setAvailabilityData({
            slotDuration: avail.slotDuration || 30,
            timeZone: avail.timeZone || 'UTC',
            isAcceptingAppointments: avail.isAcceptingAppointments !== false,
            schedule: mergedSchedule,
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProfile();
  }, []);

  // Save Profile Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const payload = {
        specialization: profileData.specialization,
        qualification: profileData.qualification,
        experienceYears: Number(profileData.experienceYears),
        consultationFee: Number(profileData.consultationFee),
        roomNumber: profileData.roomNumber,
        bio: profileData.bio,
      };

      const res = await api.put('/doctor/profile', payload);
      if (res.data?.success) {
        setSuccessMessage('Your physician practice profile has been updated.');
        setProfile(res.data.doctor);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Update a schedule entry
  const handleDayChange = (index, field, value) => {
    setAvailabilityData((prev) => {
      const nextSchedule = [...prev.schedule];
      nextSchedule[index] = {
        ...nextSchedule[index],
        [field]: value,
      };
      return { ...prev, schedule: nextSchedule };
    });
  };

  // Save Weekly Availability Schedule
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const payload = {
        slotDuration: Number(availabilityData.slotDuration),
        timeZone: availabilityData.timeZone,
        isAcceptingAppointments: availabilityData.isAcceptingAppointments,
        schedule: availabilityData.schedule.filter((s) => s.isActive),
      };

      const res = await api.put('/doctor/availability', payload);
      if (res.data?.success) {
        setSuccessMessage('Your weekly consultation availability schedule has been updated.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability schedule.');
    } finally {
      setScheduleSaving(false);
    }
  };

  // Toggle Doctor Active / Unavailable Status
  const handleToggleActive = async () => {
    setStatusToggling(true);
    setError('');
    try {
      const res = await api.patch('/doctor/availability/toggle');
      if (res.data?.success) {
        setProfile((prev) => ({
          ...prev,
          isAvailable: res.data.isAvailable,
        }));
        setAvailabilityData((prev) => ({
          ...prev,
          isAcceptingAppointments: res.data.isAcceptingAppointments,
        }));
        setSuccessMessage(`Practice status switched to ${res.data.isAvailable ? 'Available' : 'Unavailable'}.`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle availability.');
    } finally {
      setStatusToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading doctor settings...</p>
      </div>
    );
  }

  if (!profileExists || !profile) {
    return (
      <div>
        <PageHeader
          title="Doctor Profile & Practice Settings"
          subtitle="Configure consultation availability, weekly working hours, and consultation fees"
        />
        <Card>
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Profile Not Provisioned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              Your doctor account is active, but a clinical profile has not yet been initialized by hospital administration.
              Please contact the hospital administrator to link your medical department and credentials.
            </p>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchMyProfile}>
              Check Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Profile & Practice Settings"
        subtitle="Manage your outpatient consultation availability, weekly shifts, room allocation, and patient fees"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={profile.isAvailable ? 'outline' : 'primary'}
              size="sm"
              icon={Power}
              loading={statusToggling}
              onClick={handleToggleActive}
            >
              {profile.isAvailable ? 'Go Offline / Mark Unavailable' : 'Go Online / Mark Available'}
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

      {/* Practice Header Overview */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-lg text-white">
            {profile.user?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{profile.user?.name}</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                  profile.isAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    profile.isAvailable ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                {profile.isAvailable ? 'Accepting Patients' : 'Unavailable'}
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              {profile.specialization} • {profile.department?.name || 'Unassigned Dept'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-blue-100 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-[10px] text-blue-300 uppercase tracking-wider">Fee</div>
            <div className="font-bold text-white text-sm">₹{profile.consultationFee}</div>
          </div>
          <div>
            <div className="text-[10px] text-blue-300 uppercase tracking-wider">Room / Cabin</div>
            <div className="font-bold text-white text-sm">{profile.roomNumber || 'Not set'}</div>
          </div>
          <div>
            <div className="text-[10px] text-blue-300 uppercase tracking-wider">Experience</div>
            <div className="font-bold text-white text-sm">{profile.experienceYears} Years</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Practice Profile Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card
            title="Clinical Credentials"
            subtitle="Details visible to patients in the doctor directory"
          >
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                  <span>{profile.department?.name || 'Unassigned'}</span>
                  <span className="text-[10px] text-slate-400">Admin Managed</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.specialization}
                  onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualifications & Certifications *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.qualification}
                  onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileData.experienceYears}
                    onChange={(e) => setProfileData({ ...profileData, experienceYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileData.consultationFee}
                    onChange={(e) => setProfileData({ ...profileData, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cabin / Clinic Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cabin 204, East Wing"
                  value={profileData.roomNumber}
                  onChange={(e) => setProfileData({ ...profileData, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Bio
                </label>
                <textarea
                  rows="4"
                  placeholder="Summary of clinical background and care philosophy..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Save}
                loading={profileSaving}
                className="w-full justify-center"
              >
                Save Practice Details
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Weekly Consultation Availability Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Weekly Consultation Roster & Working Hours"
            subtitle="Configure standard outpatient hours and patient booking slot duration"
          >
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Slot Duration (Minutes)
                  </label>
                  <select
                    value={availabilityData.slotDuration}
                    onChange={(e) =>
                      setAvailabilityData({ ...availabilityData, slotDuration: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="20">20 Minutes</option>
                    <option value="30">30 Minutes (Recommended)</option>
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
                    value={availabilityData.timeZone}
                    onChange={(e) =>
                      setAvailabilityData({ ...availabilityData, timeZone: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={availabilityData.isAcceptingAppointments}
                      onChange={(e) =>
                        setAvailabilityData({
                          ...availabilityData,
                          isAcceptingAppointments: e.target.checked,
                        })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Accept Online Appointments</span>
                  </label>
                </div>
              </div>

              {/* Weekly Roster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>Day & Shift (24-Hour Format HH:mm)</span>
                  <span className="text-slate-400 font-normal text-[11px]">Break Interval (Optional)</span>
                </div>

                <div className="space-y-2">
                  {availabilityData.schedule.map((entry, idx) => (
                    <div
                      key={entry.day}
                      className={`p-3 rounded-xl border transition-colors ${
                        entry.isActive
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-slate-50/70 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-36">
                          <input
                            type="checkbox"
                            checked={entry.isActive}
                            onChange={(e) => handleDayChange(idx, 'isActive', e.target.checked)}
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
                                onChange={(e) => handleDayChange(idx, 'startTime', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                              <span className="text-slate-400">to</span>
                              <input
                                type="time"
                                value={entry.endTime}
                                onChange={(e) => handleDayChange(idx, 'endTime', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-1 text-xs md:ml-auto">
                              <span className="text-slate-400 text-[10px]">Break:</span>
                              <input
                                type="time"
                                value={entry.breakStart}
                                onChange={(e) => handleDayChange(idx, 'breakStart', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                type="time"
                                value={entry.breakEnd}
                                onChange={(e) => handleDayChange(idx, 'breakEnd', e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">Day Off / Clinic Closed</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Save}
                  loading={scheduleSaving}
                >
                  Save Weekly Availability Schedule
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
