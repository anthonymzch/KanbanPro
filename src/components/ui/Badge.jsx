export default function Badge({ className = '', title, children, ...rest }) {
  return (
    <span
      title={title}
      {...rest}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4 ${className}`}
    >
      {children}
    </span>
  )
}
