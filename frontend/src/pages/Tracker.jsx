import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Button from '../components/common/button'
import Loader from '../components/common/Loader'
import { useApi } from '../hooks/useApi'
import { APPLICATION_STATUSES } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Tracker() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: '', role: '', notes: '', status: 'Applied' })
  const { get, post, put, del } = useApi()

  const fetchApps = () => get('/api/applications').then(res => { setApps(res.data.applications); setLoading(false) })
  useEffect(() => { fetchApps() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await post('/api/apply', form)
    toast.success('Application added')
    setShowForm(false); setForm({ company: '', role: '', notes: '', status: 'Applied' })
    fetchApps()
  }

  const updateStatus = async (id, status) => { await put(`/api/applications/${id}`, { status }); fetchApps() }
  const deleteApp = async (id) => { if (confirm('Delete?')) { await del(`/api/applications/${id}`); fetchApps() } }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">Application Tracker</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus size={18} /> Add</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 mb-8 grid md:grid-cols-4 gap-4">
          <input className="bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} required />
          <input className="bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} required />
          <select className="bg-white/5 border border-white/10 rounded p-2 text-white" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {APPLICATION_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <Button type="submit">Save</Button>
        </form>
      )}

      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-4 gap-4">
          {APPLICATION_STATUSES.map(status => (
            <div key={status} className="glass-card p-4">
              <h3 className="font-semibold mb-3 text-primary-purple">{status}</h3>
              <div className="space-y-3">
                {apps.filter(a => a.status === status).map(app => (
                  <div key={app.id} className="bg-white/5 rounded-lg p-3">
                    <p className="font-medium">{app.role}</p>
                    <p className="text-sm text-white/60">{app.company}</p>
                    <div className="flex gap-2 mt-2">
                      <select className="text-xs bg-transparent border border-white/20 rounded" value={app.status} onChange={(e) => updateStatus(app.id, e.target.value)}>
                        {APPLICATION_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteApp(app.id)} className="text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}