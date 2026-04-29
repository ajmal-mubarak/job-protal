import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  User, Mail, MapPin, Briefcase, Upload, FileText,
  Edit3, Save, X, CheckCircle, ExternalLink, Loader, Camera,
} from 'lucide-react'
import Navbar from '../../components/layout/Navbar'
import { profilesApi } from '../../api/profiles'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

const SKILL_SUGGESTIONS = [
  'JavaScript', 'React', 'Python', 'FastAPI', 'Node.js', 'TypeScript',
  'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'Figma',
  'Machine Learning', 'Data Analysis', 'Marketing', 'Sales', 'HR',
]

function SkillInput({ skills = [], onChange }) {
  const [input, setInput] = useState('')
  const [showSugs, setShowSugs] = useState(false)

  const suggestions = SKILL_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s)
  )

  const addSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) onChange([...skills, trimmed])
    setInput('')
    setShowSugs(false)
  }

  const removeSkill = (skill) => onChange(skills.filter((s) => s !== skill))

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((skill) => (
          <span key={skill} className="badge badge-primary flex items-center gap-1">
            {skill}
            <button onClick={() => removeSkill(skill)} className="hover:text-error ml-0.5">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSugs(true) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) { e.preventDefault(); addSkill(input) }
          }}
          onFocus={() => setShowSugs(true)}
          onBlur={() => setTimeout(() => setShowSugs(false), 150)}
          placeholder="Add a skill and press Enter..."
          className="input text-sm"
        />
        {showSugs && input && suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 card border border-border shadow-glow mt-1 max-h-40 overflow-y-auto">
            {suggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                onMouseDown={() => addSkill(s)}
                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
        <div className="card p-6 mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
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
            <div>
              {editing ? (
                <input
                  value={form.name || ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input text-lg font-bold mb-1"
                  placeholder="Your name"
                />
              ) : (
                <h1 className="text-xl font-bold text-text-primary">{profile?.name}</h1>
              )}
              <p className="text-sm text-text-muted capitalize">{role}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <Mail size={11} /> {profile?.email}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={handleCancel} className="btn-ghost btn-sm text-sm" disabled={saving}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} className="btn-primary btn-sm text-sm" disabled={saving}>
                  {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary btn-sm text-sm">
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
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
                      value={form.experience_years ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, experience_years: parseInt(e.target.value) || 0 }))}
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

                {/* Open to work */}
                <div className="flex items-center gap-3">
                  <input
                    id="open-to-work"
                    type="checkbox"
                    checked={editing ? (form.is_open_to_work ?? true) : (profile?.is_open_to_work ?? true)}
                    onChange={(e) => editing && setForm((f) => ({ ...f, is_open_to_work: e.target.checked }))}
                    disabled={!editing}
                    className="accent-primary w-4 h-4"
                  />
                  <label htmlFor="open-to-work" className="text-sm text-text-secondary cursor-pointer">
                    Open to work — visible to employers & recruiters
                  </label>
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
