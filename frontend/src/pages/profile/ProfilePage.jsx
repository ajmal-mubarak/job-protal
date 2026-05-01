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
    <div className="card p-5 border-dashed">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary-light" />
          <span className="font-medium text-text-primary text-sm">Resume (PDF)</span>
        </div>
        {resumeUrl && (
          <span className="badge badge-success flex items-center gap-1">
            <CheckCircle size={11} /> Uploaded
          </span>
        )}
      </div>

      {resumeUrl ? (
        <div className="flex items-center gap-3 mb-3">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-light flex items-center gap-1 transition-colors"
          >
            <ExternalLink size={13} /> View current resume
          </a>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-text-muted text-xs">Auto-attached when you apply</span>
        </div>
      ) : (
        <p className="text-xs text-text-muted mb-3">
          Upload once, auto-attach to all your job applications.
        </p>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="btn-secondary text-sm flex items-center gap-2"
      >
        {uploading ? (
          <Loader size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        {uploading ? 'Uploading...' : resumeUrl ? 'Replace Resume' : 'Upload PDF Resume'}
      </button>
      <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
    </div>
  )
}

export default function ProfilePage() {
  const { user, role, isJobSeeker, canPostJob } = useAuth()
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

  const field = (key, fallback = '') => editing ? form[key] ?? fallback : profile?.[key] ?? fallback

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={28} className="text-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Left: Avatar + info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Avatar — clickable to upload */}
              <div className="relative flex-shrink-0 group">
                <div
                  onClick={() => avatarRef.current?.click()}
                  className="w-16 h-16 rounded-2xl overflow-hidden border border-primary/30 cursor-pointer"
                  title="Click to change photo"
                >
                  {avatarUploading ? (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <Loader size={20} className="text-primary-light animate-spin" />
                    </div>
                  ) : profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary-light">
                      {profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {/* Camera overlay on hover */}
                {!avatarUploading && (
                  <div
                    onClick={() => avatarRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera size={18} className="text-white" />
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
                    className="input text-lg font-bold mb-1 w-full"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-text-primary truncate">{profile?.name}</h1>
                )}
                <p className="text-sm text-text-muted capitalize">{role}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-text-muted truncate">
                  <Mail size={11} className="flex-shrink-0" /> <span className="truncate">{profile?.email}</span>
                </div>
              </div>
            </div>

            {/* Right: Edit / Save / Cancel buttons */}
            <div className="flex gap-2 flex-shrink-0 self-start">
              {editing ? (
                <>
                  <button onClick={handleCancel} className="btn-ghost btn-sm text-sm" disabled={saving}>
                    <X size={14} /> <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button onClick={handleSave} className="btn-primary btn-sm text-sm" disabled={saving}>
                    {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary btn-sm text-sm">
                  <Edit3 size={14} /> <span className="hidden xs:inline sm:inline">Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>


        {/* ── Job Seeker specific fields ── */}
        {isJobSeeker && (
          <>
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-text-primary mb-5 flex items-center gap-2">
                <User size={16} /> Professional Info
              </h2>

              <div className="grid gap-5">
                {/* Headline */}
                <div>
                  <label className="label">Professional Headline</label>
                  {editing ? (
                    <input
                      value={form.headline || ''}
                      onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                      placeholder="e.g. Full-Stack Developer · 3 years experience"
                      className="input"
                    />
                  ) : (
                    <p className="text-sm text-text-secondary">{profile?.headline || <span className="text-text-muted italic">Not set</span>}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="label">Location</label>
                  {editing ? (
                    <input
                      value={form.location || ''}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Bangalore, India"
                      className="input"
                    />
                  ) : (
                    <p className="text-sm text-text-secondary flex items-center gap-1">
                      {profile?.location ? <><MapPin size={12} />{profile.location}</> : <span className="text-text-muted italic">Not set</span>}
                    </p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label className="label">Years of Experience</label>
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
                      className="input w-32"
                    />
                  ) : (
                    <p className="text-sm text-text-secondary flex items-center gap-1">
                      <Briefcase size={12} /> {profile?.experience_years ?? 0} year{profile?.experience_years !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <label className="label">Skills</label>
                  {editing ? (
                    <SkillInput
                      skills={form.skills || []}
                      onChange={(skills) => setForm((f) => ({ ...f, skills }))}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(profile?.skills || []).length === 0
                        ? <span className="text-text-muted italic text-sm">No skills added</span>
                        : (profile.skills || []).map((s) => (
                            <span key={s} className="badge badge-muted">{s}</span>
                          ))
                      }
                    </div>
                  )}
                </div>

                {/* Working hours (replaces simple checkbox) */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Clock size={13} /> Working Hours
                  </label>

                  {editing ? (
                    <div className="space-y-3">
                      {/* Open to work toggle */}
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                          onClick={() => setForm((f) => ({ ...f, is_open_to_work: !f.is_open_to_work }))}
                          className={cn(
                            'relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer',
                            form.is_open_to_work ? 'bg-primary' : 'bg-surface-3 border border-border'
                          )}
                        >
                          <span className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                            form.is_open_to_work ? 'translate-x-5' : 'translate-x-0.5'
                          )} />
                        </div>
                        <span className="text-sm text-text-secondary">
                          {form.is_open_to_work ? 'Open to work — visible to employers' : 'Not looking for work'}
                        </span>
                      </label>

                      {/* Time range */}
                      {form.is_open_to_work && (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted w-10">From</span>
                            <input
                              type="time"
                              value={form.work_start || '08:00'}
                              onChange={(e) => setForm((f) => ({ ...f, work_start: e.target.value }))}
                              className="input py-1.5 px-3 text-sm w-32"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted w-10">To</span>
                            <input
                              type="time"
                              value={form.work_end || '21:00'}
                              onChange={(e) => setForm((f) => ({ ...f, work_end: e.target.value }))}
                              className="input py-1.5 px-3 text-sm w-32"
                            />
                          </div>
                          <p className="text-xs text-text-muted">
                            Employers see "Available" when you're in this window
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      {profile?.is_open_to_work ? (
                        <>
                          <span className="badge badge-success text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Open to Work
                          </span>
                          {profile?.work_start && profile?.work_end ? (
                            <span className="text-sm text-text-secondary flex items-center gap-1">
                              <Clock size={12} className="text-text-muted" />
                              {profile.work_start} – {profile.work_end}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted italic">No hours set — click Edit to add</span>
                          )}
                        </>
                      ) : (
                        <span className="badge badge-muted text-xs">Not looking for work</span>
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
          <div className="card p-6">
            <h2 className="font-semibold text-text-primary mb-5 flex items-center gap-2">
              <Briefcase size={16} /> Company Info
            </h2>
            <div className="grid gap-5">
              <div>
                <label className="label">Company Name</label>
                {editing ? (
                  <input value={form.company_name || ''} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} className="input" />
                ) : (
                  <p className="text-sm text-text-secondary">{profile?.company_name || <span className="text-text-muted italic">Not set</span>}</p>
                )}
              </div>
              <div>
                <label className="label">Company Description</label>
                {editing ? (
                  <textarea value={form.company_description || ''} onChange={(e) => setForm((f) => ({ ...f, company_description: e.target.value }))} className="input min-h-[80px]" rows={3} />
                ) : (
                  <p className="text-sm text-text-secondary">{profile?.company_description || <span className="text-text-muted italic">Not set</span>}</p>
                )}
              </div>
              <div>
                <label className="label">Website</label>
                {editing ? (
                  <input value={form.website || ''} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://yourcompany.com" className="input" />
                ) : (
                  profile?.website
                    ? <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-light flex items-center gap-1"><ExternalLink size={13} />{profile.website}</a>
                    : <span className="text-text-muted italic text-sm">Not set</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Recruiter specific fields ── */}
        {role === 'recruiter' && (
          <div className="card p-6">
            <h2 className="font-semibold text-text-primary mb-5 flex items-center gap-2">
              <User size={16} /> Recruiter Info
            </h2>
            <div className="grid gap-5">
              <div>
                <label className="label">Agency Name</label>
                {editing ? (
                  <input value={form.agency_name || ''} onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))} className="input" />
                ) : (
                  <p className="text-sm text-text-secondary">{profile?.agency_name || <span className="text-text-muted italic">Not set</span>}</p>
                )}
              </div>
              <div>
                <label className="label">Bio</label>
                {editing ? (
                  <textarea value={form.bio || ''} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="input min-h-[80px]" rows={3} />
                ) : (
                  <p className="text-sm text-text-secondary">{profile?.bio || <span className="text-text-muted italic">Not set</span>}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
