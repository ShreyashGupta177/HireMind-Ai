export default function StatCard({ title, value, icon, trend }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">{title}</span>
        <span className="text-primary-purple">{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-bold gradient-text">{value}</div>
      {trend && <div className="mt-2 text-xs text-emerald-400">↑ {trend}% vs last week</div>}
    </div>
  )
}