export default function SkillBadge({ skill, missing }) {
  return (
    <span className={`
      px-3 py-1 text-sm rounded-full border transition-colors
      ${missing 
        ? 'bg-red-500/10 text-red-400 border-red-500/30' 
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      }
    `}>
      {skill}
    </span>
  )
}