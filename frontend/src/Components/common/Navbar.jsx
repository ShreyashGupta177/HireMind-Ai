import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'
import Button from './button'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Jobs', path: '/jobs' },
  { name: 'Analyze', path: '/analyze' },
  { name: 'AI Coach', path: '/coach' },
  { name: 'Tracker', path: '/tracker' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={clsx(
      'fixed top-0 w-full z-50 transition-all duration-300',
      isScrolled ? 'bg-deep-black/80 backdrop-blur-lg border-b border-white/5 py-3' : 'bg-transparent py-5'
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          <span className="gradient-text">HireMind</span>
          <span className="text-white/70 ml-1">AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={clsx(
                'text-sm font-medium transition-colors',
                location.pathname === link.path ? 'text-primary-purple' : 'text-white/70 hover:text-white'
              )}
            >
              {link.name}
            </Link>
          ))}
          <Button size="sm">Get Started</Button>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-deep-black/95 backdrop-blur-lg border-b border-white/5 py-4">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="block px-6 py-3 text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}