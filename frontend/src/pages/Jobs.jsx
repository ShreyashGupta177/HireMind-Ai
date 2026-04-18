import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import JobCard from '../components/common/JobCard'
import Loader from '../components/common/Loader'
import { useApi } from '../hooks/useApi'
import { PLATFORMS } from '../utils/constants'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState('All')
  const [search, setSearch] = useState('')
  const { get } = useApi()

  useEffect(() => {
    setLoading(true)
    get(`/api/scrape/jobs?platform=${platform === 'All' ? '' : platform.toLowerCase()}&limit=50`)
      .then(res => { setJobs(res.data.jobs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [platform])

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(search.toLowerCase()) ||
    job.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold gradient-text mb-6">Browse Jobs</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text" placeholder="Search title or company..."
            className="w-full bg-dark-purple/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary-purple"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-dark-purple/50 border border-white/10 rounded-lg px-4 py-3 text-white"
          value={platform} onChange={(e) => setPlatform(e.target.value)}
        >
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, i) => <JobCard key={i} job={job} />)}
        </div>
      )}
    </div>
  )
}