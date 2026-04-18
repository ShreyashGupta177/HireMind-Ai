import clsx from 'clsx'

export default function Button({ children, variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={clsx(
        'rounded-lg font-medium transition-all duration-300 disabled:opacity-50',
        variant === 'primary' && 'bg-gradient-brand text-white hover:shadow-glow-purple hover:scale-[1.02]',
        variant === 'outline' && 'border border-primary-purple/50 text-primary-purple hover:bg-primary-purple/10',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3',
        size === 'lg' && 'px-8 py-4 text-lg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}