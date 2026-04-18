import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PlatformChart({ data }) {
  return (
    <div className="glass-card p-6 h-64">
      <h3 className="text-white font-semibold mb-4">Jobs by Platform</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="platform" stroke="#ffffff60" />
          <YAxis stroke="#ffffff60" />
          <Tooltip contentStyle={{ background: '#1a1124', border: '1px solid #a855f7' }} />
          <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}