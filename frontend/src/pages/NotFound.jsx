import { Link } from 'react-router-dom'
import Button from '../components/common/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-6 py-24 text-center">
      <h1 className="text-8xl font-bold gradient-text">404</h1>
      <p className="text-xl text-white/60 mt-4">Page not found</p>
      <Link to="/"><Button className="mt-8">Go Home</Button></Link>
    </div>
  )
}