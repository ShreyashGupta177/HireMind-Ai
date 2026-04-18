import { Link } from 'react-router-dom'

export default function RecentJobsTable({ jobs }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-white font-semibold mb-4">Recent Scraped Jobs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60 border-b border-white/10">
            <tr><th className="pb-3 text-left">Title</th><th className="pb-3 text-left">Company</th><th className="pb-3 text-left">Platform</th></tr>
          </thead>
          <tbody>
            {jobs?.slice(0, 5).map((job, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-3"><Link to={`/jobs/${job.id}`} className="hover:text-primary-purple">{job.title}</Link></td>
                <td className="py-3 text-white/70">{job.company}</td>
                <td className="py-3"><span className="px-2 py-1 text-xs rounded bg-primary-purple/20">{job.platform}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}