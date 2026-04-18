import { useState } from 'react'
import { Brain, AlertTriangle } from 'lucide-react'
import FileDropzone from '../components/upload/FileDropzone'
import JobCard from '../components/common/JobCard'
import Button from '../components/common/button'
import Loader from '../components/common/Loader'
import { useApi } from '../hooks/useApi'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'

export default function Coach() {
  const [ranking, setRanking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [crisisAdvice, setCrisisAdvice] = useState(null)
  const { resumeText, setResumeText } = useApp()
  const { get, post } = useApi()

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    setResumeText(res.data.extractedText)
    toast.success('Resume ready!')
  }

  const getRankings = async () => {
    if (!resumeText) return toast.error('Upload resume first')
    setLoading(true)
    try {
      const [adviceRes, rankRes] = await Promise.all([
        get('/api/ml/crisis-advice'),
        post('/api/ml/rank-scraped-jobs', { resume_text: resumeText, limit: 30 })
      ])
      setCrisisAdvice(adviceRes.data)
      setRanking(rankRes.data.ranked_jobs)
    } catch { toast.error('Ranking failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2"><Brain /> AI Career Coach</h1>
      <p className="text-white/60 mb-8">Upload your resume – AI will rank all available jobs and provide crisis‑aware guidance.</p>

      {crisisAdvice?.crisis_mode_active && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="text-amber-400" />
          <div><strong className="text-amber-400">Crisis Mode Active</strong><p className="text-white/80 text-sm">{crisisAdvice.advice}</p></div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <FileDropzone onFileAccepted={handleUpload} />
          <Button className="mt-4 w-full" onClick={getRankings} disabled={!resumeText || loading}>
            {loading ? <Loader /> : 'Rank Jobs for Me'}
          </Button>
          {crisisAdvice?.recommended_skills && (
            <div className="mt-6 glass-card p-4">
              <h4 className="font-semibold mb-2">🔥 Hot Skills</h4>
              <div className="flex flex-wrap gap-2">{crisisAdvice.recommended_skills.map(s => <span key={s} className="px-2 py-1 bg-primary-purple/20 rounded text-sm">{s}</span>)}</div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {ranking ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {ranking.map((job, i) => <JobCard key={i} job={{ ...job, match_score: job.match_score }} />)}
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-white/40">Upload resume and click "Rank Jobs" to see personalized matches</div>
          )}
        </div>
      </div>
    </div>
  )
}