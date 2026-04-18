import { Link } from 'react-router-dom'
import { MapPin, Briefcase } from 'lucide-react'

export default function JobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id || job._id}`} className="block">
      <div className="glass-card p-6 transition-all duration-300 hover:shadow-glow-purple hover:border-primary-purple/30 cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-white">{job.title}</h3>
            <p className="text-primary-purple mt-1">{job.company}</p>
          </div>
          <span className="px-3 py-1 text-xs rounded-full bg-primary-purple/20 text-primary-purple border border-primary-purple/30">
            {job.platform || 'Direct'}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-4 text-white/60 text-sm">
          <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || 'Remote'}</span>
          {job.stipend && <span className="flex items-center gap-1"><Briefcase size={14} /> {job.stipend}</span>}
        </div>
        {job.match_score !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-brand rounded-full" style={{ width: `${job.match_score}%` }} />
            </div>
            <span className="text-sm font-medium text-white">{job.match_score}%</span>
          </div>
        )}
      </div>
    </Link>
  )
}