export default function Badge({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${className}`}
    >
      {children}
    </span>
  )
}
