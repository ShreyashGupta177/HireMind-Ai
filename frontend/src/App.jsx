import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Analyze from './pages/Analyze'
import Coach from './pages/Coach'
import Tracker from './pages/Tracker'
import NotFound from './pages/NotFound'
import { AppProvider } from './context/AppContext'
import useLenis from './hooks/useLenis'

function AppContent() {
  useLenis()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1a1124', color: '#fff' } }} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  )
}