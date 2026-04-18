import { useEffect, useState } from 'react'
import { Briefcase, CheckCircle, TrendingUp } from 'lucide-react'
import StatCard from '../components/common/StatCard'
import PlatformChart from '../components/dashboard/PlatformChart'
import RecentJobsTable from '../components/dashboard/RecentJobsTable'
import { useApi } from '../hooks/useApi'
import Loader from '../components/common/Loader'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { get } = useApi()

  useEffect(() => {
    get('/api/v2/dashboard')
      .then(res => { setStats(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="container mx-auto px-6 py-12"><Loader /></div>

  const chartData = stats?.by_platform ? Object.entries(stats.by_platform).map(([platform, count]) => ({ platform, count })) : []

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold gradient-text mb-8">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Jobs" value={stats?.total_jobs || 0} icon={<Briefcase />} />
        <StatCard title="Applications" value={stats?.total_applications || 0} icon={<CheckCircle />} />
        <StatCard title="Avg Match" value="78%" icon={<TrendingUp />} trend="5" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <PlatformChart data={chartData} />
        <RecentJobsTable jobs={stats?.recent_jobs || []} />
      </div>
    </div>
  )
}