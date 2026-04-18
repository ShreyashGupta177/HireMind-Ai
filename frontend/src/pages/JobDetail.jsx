import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { MapPin, Building, Calendar, ArrowLeft } from 'lucide-react'
import Button from '../components/common/button'
import Loader from '../components/common/Loader'
import { useApi } from '../hooks/useApi'

export default function JobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const { get } = useApi()

  useEffect(() => {
    // Since scraped jobs don't have individual GET, find in list
    get('/api/scrape/jobs?limit=200').then(res => {
      const found = res.data.jobs.find(j => j.id === id || j._id === id)
      setJob(found || null)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="container mx-auto px-6 py-12"><Loader /></div>
  if (!job) return <div className="container mx-auto px-6 py-12 text-center text-white/60">Job not found</div>

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
        <ArrowLeft size={18} /> Back to jobs
      </Link>
      <div className="glass-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{job.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-white/70">
              <span className="flex items-center gap-1"><Building size={16} /> {job.company}</span>
              <span className="flex items-center gap-1"><MapPin size={16} /> {job.location || 'Remote'}</span>
              {job.stipend && <span className="text-primary-purple">{job.stipend}</span>}
            </div>
          </div>
          <span className="px-3 py-1 text-sm rounded-full bg-primary-purple/20 text-primary-purple">{job.platform}</span>
        </div>
        
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h3 className="font-semibold mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills?.map((s, i) => (
              <span key={i} className="px-3 py-1 bg-primary-purple/10 text-primary-purple rounded-full text-sm">{s}</span>
            )) || <span className="text-white/50">Not specified</span>}
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link to={`/analyze?jobId=${job.id}`}><Button>Analyze with AI</Button></Link>
          <Button variant="outline">Track Application</Button>
        </div>
        <p className="text-white/40 text-sm mt-4 flex items-center gap-1"><Calendar size={14} /> Posted: {job.scraped_at ? new Date(job.scraped_at).toLocaleDateString() : 'Recently'}</p>
      </div>
    </div>
  )
}