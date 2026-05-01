import { useState } from 'react'
import { X } from 'lucide-react'

const SKILL_SUGGESTIONS = [
  'JavaScript', 'React', 'Python', 'FastAPI', 'Node.js', 'TypeScript',
  'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'Figma',
  'Machine Learning', 'Data Analysis', 'Marketing', 'Sales', 'HR',
]

export default function SkillInput({ skills = [], onChange }) {
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
            <button type="button" onClick={() => removeSkill(skill)} className="hover:text-error ml-0.5">
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
                type="button"
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
