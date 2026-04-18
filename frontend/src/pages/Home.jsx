import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, BarChart3, Upload, Target } from 'lucide-react'
import gsap from 'gsap' 
import Button from '../components/common/button'
import { useGSAP } from '../hooks/useGSAP'

export default function Home() {
  useGSAP(() => {
    gsap.from('.hero-title', { y: 50, opacity: 0, duration: 1, ease: 'power3.out' })
    gsap.from('.hero-sub', { y: 30, opacity: 0, duration: 1, delay: 0.2, ease: 'power3.out' })
    gsap.from('.feature-card', { scale: 0.9, opacity: 0, stagger: 0.1, duration: 0.8, scrollTrigger: { trigger: '.features' } })
  })

  return (
    <div>
      <section className="container mx-auto px-6 py-16 md:py-24 text-center">
        <div className="hero-title">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Navigate Your Career with <span className="gradient-text">AI Precision</span>
          </h1>
        </div>
        <p className="hero-sub text-xl text-white/60 max-w-2xl mx-auto mt-6">
          Crisis‑aware job matching, resume analysis, and personalized learning roadmaps – all in one intelligent dashboard.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-10">
          <Link to="/analyze"><Button size="lg" className="gap-2"><Sparkles size={20} /> Analyze Resume</Button></Link>
          <Link to="/jobs"><Button variant="outline" size="lg" className="gap-2">Browse Jobs <ArrowRight size={20} /></Button></Link>
        </div>
      </section>

      <section className="features container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <BarChart3 />, title: 'Multi‑Platform Scraping', desc: 'Jobs from LinkedIn, Internshala & Naukri aggregated daily.' },
            { icon: <Target />, title: 'Crisis‑Aware AI', desc: 'Market‑aware analysis with recession‑proof recommendations.' },
            { icon: <Upload />, title: 'Skill Roadmaps', desc: 'Personalized learning paths with courses & time estimates.' },
          ].map((f, i) => (
            <div key={i} className="feature-card glass-card p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-brand flex items-center justify-center text-white">{f.icon}</div>
              <h3 className="text-xl font-semibold mt-6">{f.title}</h3>
              <p className="text-white/60 mt-3">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}