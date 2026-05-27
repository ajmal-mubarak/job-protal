import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  User, Mail, MapPin, Briefcase, Upload, FileText,
  Edit3, Save, X, CheckCircle, ExternalLink, Loader, Camera, Clock,
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import { profilesApi } from '../../api/profiles'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'
import SkillInput from '../../components/ui/SkillInput'

function ResumeUpload({ resumeUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      return
    }
    setUploading(true)
    try {
      const res = await profilesApi.uploadResume(file)
      onUploaded(res.data.url)
      toast.success('Resume uploaded! It will auto-attach to your applications.')
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="bg-white border border-dashed border-indigo-200/80 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.012)] hover:border-indigo-300 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FileText size={16} />
          </div>
          <span className="font-bold text-slate-800 text-sm">Resume (PDF)</span>
        </div>
        {resumeUrl && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            <CheckCircle size={10} /> Active
          </span>
        )}
      </div>

      {resumeUrl ? (
        <div className="bg-indigo-50/20 border border-indigo-100/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={13} /> View current resume
            </a>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Auto-attached when you apply to any jobs</p>
          </div>
        </div>
      ) : (
        <p className="text-xs font-semibold text-slate-400 mb-4 leading-relaxed">
          Upload your PDF once, and it will be auto-attached when you apply for jobs on our portal.
        </p>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
      >
        {uploading ? (
          <Loader size={14} className="animate-spin text-indigo-600" />
        ) : (
          <Upload size={14} className="text-slate-400" />
        )}
        {uploading ? 'Uploading...' : resumeUrl ? 'Replace Resume' : 'Upload PDF Resume'}
      </button>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
    </div>
  )
}

export default function ProfilePage() {
  const { user, role, isJobSeeker } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarRef = useRef()

  useEffect(() => {
    profilesApi.getMe()
      .then((res) => {
        setProfile(res.data)
        setForm(res.data)
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await profilesApi.updateMe(form)
      setProfile(form)
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm(profile)
    setEditing(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const res = await profilesApi.uploadAvatar(file)
      setProfile((p) => ({ ...p, avatar_url: res.data.url }))
      toast.success('Profile photo updated!')
    } catch {
      toast.error('Photo upload failed. Please try again.')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={28} className="text-indigo-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 animate-fade-in space-y-6">
        {/* Header card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.015)] transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Avatar + info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Avatar — clickable to upload */}
              <div className="relative flex-shrink-0 group">
                <div
                  onClick={() => avatarRef.current?.click()}
                  className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 cursor-pointer shadow-sm relative transition-all duration-300 hover:border-indigo-200"
                  title="Click to change photo"
                >
                  {avatarUploading ? (
                    <div className="w-full h-full bg-indigo-50/50 flex items-center justify-center">
                      <Loader size={20} className="text-indigo-500 animate-spin" />
                    </div>
                  ) : profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-3xl font-extrabold text-indigo-500">
                      {profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {/* Camera overlay on hover */}
                {!avatarUploading && (
                  <div
                    onClick={() => avatarRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  >
                    <Camera size={20} className="text-white" />
                  </div>
                )}
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    value={form.name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-base font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all mb-2"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight truncate">{profile?.name}</h1>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50 uppercase tracking-wide">
                    {role}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Mail size={12} className="text-slate-300" />
                    <span className="truncate">{profile?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Edit / Save / Cancel buttons */}
            <div className="flex gap-2 flex-shrink-0 self-start sm:self-center">
              {editing ? (
                <>
                  <button onClick={handleCancel} className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm" disabled={saving}>
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100 active:scale-95" disabled={saving}>
                    {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-3.5 py-2 bg-indigo-50/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm">
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Job Seeker specific fields ── */}
        {isJobSeeker && (
          <>
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.015)] transition-all space-y-6">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <User size={16} />
                </div>
                Professional Details
              </h2>

              <div className="grid gap-6">
                {/* Headline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Professional Headline</label>
                  {editing ? (
                    <input
                      value={form.headline || ''}
                      onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                      placeholder="e.g. Full-Stack Developer · 3 years experience"
                      className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3">
                      {profile?.headline || <span className="text-slate-400 italic font-medium">Not set yet</span>}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Location</label>
                  {editing ? (
                    <input
                      value={form.location || ''}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Bangalore, India"
                      className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3 flex items-center gap-1.5">
                      {profile?.location ? <><MapPin size={14} className="text-indigo-500" />{profile.location}</> : <span className="text-slate-400 italic font-medium">Not set yet</span>}
                    </p>
                  )}
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Years of Experience</label>
                  {editing ? (
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={form.experience_years === 0 && form.experience_years !== '0' ? '' : form.experience_years}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({ ...f, experience_years: val === '' ? '' : parseInt(val, 10) }))
                      }}
                      className="w-32 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-violet-500" /> {profile?.experience_years ?? 0} year{profile?.experience_years !== 1 ? 's' : ''} of professional experience
                    </p>
                  )}
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Skills</label>
                  {editing ? (
                    <SkillInput
                      skills={form.skills || []}
                      onChange={(skills) => setForm((f) => ({ ...f, skills }))}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3.5">
                      {(profile?.skills || []).length === 0
                        ? <span className="text-slate-400 italic font-medium text-sm">No skills added yet</span>
                        : (profile.skills || []).map((s) => (
                            <span key={s} className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100/30">
                              {s}
                            </span>
                          ))
                      }
                    </div>
                  )}
                </div>

                {/* Working hours */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" /> Working Hours & Availability
                  </label>

                  {editing ? (
                    <div className="space-y-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                      {/* Open to work toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Open to opportunities</span>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, is_open_to_work: !f.is_open_to_work }))}
                          className={cn(
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                            form.is_open_to_work ? 'bg-indigo-600' : 'bg-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                              form.is_open_to_work ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>

                      {/* Time range */}
                      {form.is_open_to_work && (
                        <div className="pt-3 border-t border-slate-200/50 space-y-3">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-10 uppercase tracking-wide">From</span>
                              <input
                                type="time"
                                value={form.work_start || '08:00'}
                                onChange={(e) => setForm((f) => ({ ...f, work_start: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-colors w-32 shadow-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-10 uppercase tracking-wide">To</span>
                              <input
                                type="time"
                                value={form.work_end || '21:00'}
                                onChange={(e) => setForm((f) => ({ ...f, work_end: e.target.value }))}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-colors w-32 shadow-sm"
                              />
                            </div>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-400">
                            Employers will see an "Available Now" green dot on your profile when they browse you during these hours.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3.5">
                      {profile?.is_open_to_work ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Open to Work
                          </span>
                          {profile?.work_start && profile?.work_end ? (
                            <span className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                              <Clock size={14} className="text-slate-300" />
                              Availability hours: {profile.work_start} – {profile.work_end}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium">No hours set — click Edit to add</span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Not looking for work right now
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume section */}
            <ResumeUpload
              resumeUrl={profile?.resume_url}
              onUploaded={(url) => setProfile((p) => ({ ...p, resume_url: url }))}
            />
          </>
        )}

        {/* ── Employer specific fields ── */}
        {role === 'employer' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.015)] transition-all">
            <h2 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Briefcase size={16} />
              </div>
              Company Details
            </h2>
            <div className="grid gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Company Name</label>
                {editing ? (
                  <input
                    value={form.company_name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3">
                    {profile?.company_name || <span className="text-slate-400 italic font-medium">Not set yet</span>}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Company Description</label>
                {editing ? (
                  <textarea
                    value={form.company_description || ''}
                    onChange={(e) => setForm((f) => ({ ...f, company_description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[100px]"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3 whitespace-pre-wrap leading-relaxed">
                    {profile?.company_description || <span className="text-slate-400 italic font-medium">Not set yet</span>}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Website</label>
                {editing ? (
                  <input
                    value={form.website || ''}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                ) : (
                  <div className="bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3">
                    {profile?.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={13} /> {profile.website}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic font-medium text-sm">Not set yet</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Recruiter specific fields ── */}
        {role === 'recruiter' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.015)] transition-all">
            <h2 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <User size={16} />
              </div>
              Recruiter Details
            </h2>
            <div className="grid gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Agency Name</label>
                {editing ? (
                  <input
                    value={form.agency_name || ''}
                    onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3">
                    {profile?.agency_name || <span className="text-slate-400 italic font-medium">Not set yet</span>}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bio</label>
                {editing ? (
                  <textarea
                    value={form.bio || ''}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[100px]"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-600 bg-slate-50/50 border border-slate-100/50 rounded-xl px-4 py-3 whitespace-pre-wrap leading-relaxed">
                    {profile?.bio || <span className="text-slate-400 italic font-medium">Not set yet</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
