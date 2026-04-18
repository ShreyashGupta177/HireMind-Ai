import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function ScoreGauge({ score }) {
  const circleRef = useRef()
  const textRef = useRef()

  useEffect(() => {
    if (score !== undefined) {
      const circumference = 2 * Math.PI * 45
      const offset = circumference - (score / 100) * circumference
      gsap.fromTo(circleRef.current,
        { strokeDashoffset: circumference },
        { strokeDashoffset: offset, duration: 1.5, ease: 'power2.out' }
      )
      gsap.fromTo(textRef.current,
        { innerText: 0 },
        { innerText: score, duration: 1.5, snap: { innerText: 1 }, ease: 'power2.out' }
      )
    }
  }, [score])

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="80" cy="80" r="45" fill="none" stroke="#ffffff20" strokeWidth="6" />
        <circle ref={circleRef} cx="80" cy="80" r="45" fill="none" stroke="url(#gaugeGradient)" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}`} />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span ref={textRef} className="text-3xl font-bold gradient-text">{score || 0}</span>
        <span className="text-sm text-white/50 ml-1">%</span>
      </div>
    </div>
  )
}