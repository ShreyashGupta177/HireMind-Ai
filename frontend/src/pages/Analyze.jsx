import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import FileDropzone from '../components/upload/FileDropzone'
import ScoreGauge from '../components/analysis/ScoreGauge'
import SkillBadge from '../components/analysis/SkillBadge'
import RoadmapTimeline from '../components/analysis/RoadmapTimeline'
import Button from '../components/common/button'
import gsap from 'gsap' 
import Loader from '../components/common/Loader'
import { useApi } from '../hooks/useApi'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'

export default function Analyze() {
  const [file, setFile] = useState(null)
  const [jdText, setJdText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const { setResumeText } = useApp()
  const { post } = useApi()

  const handleUpload = async (acceptedFile) => {
    setFile(acceptedFile)
    const formData = new FormData()
    formData.append('file', acceptedFile)
    try {
      const res = await post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResumeText(res.data.extractedText)
      toast.success('Resume uploaded!')
    } catch (err) {
      toast.error('Upload failed')
    }
  }

  const handleAnalyze = async () => {
    const resume = file ? await extractTextFromFile() : ''
    if (!resume || !jdText) return toast.error('Resume and job description required')
    setAnalyzing(true)
    try {
      const res = await post('/api/ml/advanced-analyze', { resume_text: resume, jd_text: jdText })
      setResult(res.data)
    } catch (err) {
      toast.error('Analysis failed')
    } finally { setAnalyzing(false) }
  }

  const extractTextFromFile = async () => {
    // Already stored in context from upload, or read file if needed
    return useApp().resumeText
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-2">
        <Sparkles /> AI Resume Analysis
      </h1>
      <p className="text-white/60 mb-8">Upload your resume and paste a job description to get a detailed match report.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <FileDropzone onFileAccepted={handleUpload} isLoading={analyzing} />
          <textarea
            className="w-full mt-6 bg-dark-purple/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 h-40"
            placeholder="Paste job description here..."
            value={jdText} onChange={(e) => setJdText(e.target.value)}
          />
          <Button className="mt-4 w-full" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader /> : 'Analyze Match'}
          </Button>
        </div>

        <div className="glass-card p-6">
          {result ? (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <ScoreGauge score={result.match_score} />
                <div>
                  <p className="text-white font-medium">{result.recommendation}</p>
                  <p className="text-white/60 text-sm mt-1">{result.crisis_mode_advice}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Missing Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills?.map((s, i) => <SkillBadge key={i} skill={s} missing />)}
                </div>
              </div>
              <RoadmapTimeline roadmap={result.learning_roadmap} />
            </div>
          ) : (
            <div className="text-center text-white/40 py-12">Upload a resume and job description to see analysis</div>
          )}
        </div>
      </div>
    </div>
  )
}