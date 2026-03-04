export default function Button({ children, onClick, variant = 'primary', small, disabled, style }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-md transition-all duration-150 cursor-pointer border-none active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--ac)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg)]'
  const size = small ? 'px-3.5 py-2 text-xs' : 'px-5 py-2.5 text-sm'
  const variants = {
    primary: 'bg-[var(--ac2)] text-white hover:bg-[var(--ac)] shadow-[var(--shadow-card)]',
    ghost: 'bg-transparent text-[var(--t2)] border border-[var(--bd2)] hover:border-[var(--ac)] hover:text-[var(--t)]',
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${base} ${size} ${variants[variant]}`}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {children}
    </button>
  )
}
