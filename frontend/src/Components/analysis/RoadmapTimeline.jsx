import { ExternalLink } from 'lucide-react'

export default function RoadmapTimeline({ roadmap }) {
  if (!roadmap?.length) return null
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white">📚 Your Learning Roadmap</h4>
      <div className="space-y-3">
        {roadmap.map((item, i) => (
          <div key={i} className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{item.skill}</p>
              <p className="text-sm text-white/60">{item.platform} · {item.estimated_time}</p>
            </div>
            <a href={item.learning_link} target="_blank" rel="noopener noreferrer"
               className="text-primary-purple hover:text-accent-fuchsia transition">
              <ExternalLink size={18} />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}