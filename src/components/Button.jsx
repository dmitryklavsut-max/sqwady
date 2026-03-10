export default function Button({ children, onClick, variant = 'primary', small, disabled, className = '', style }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer border-none active:scale-[0.97] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-[var(--ac)] focus-visible:outline-offset-2'
  const size = small ? 'h-9 px-4 text-xs' : 'h-11 px-6 text-sm'
  const variants = {
    primary: 'bg-[var(--ac2)] text-white hover:bg-[var(--ac)]',
    ghost: 'bg-transparent text-[var(--t2)] border border-[var(--card-border)] hover:border-[var(--ac)] hover:text-[var(--t)]',
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${base} ${size} ${variants[variant]} ${className}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: variant === 'primary' ? '0 0 20px -5px rgba(99,102,241,0.4)' : undefined, ...style }}
    >
      {children}
    </button>
  )
}
