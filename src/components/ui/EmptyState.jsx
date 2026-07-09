export default function EmptyState({ icon: Icon, title, hint, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-edge text-center animate-fade-in ${
        compact ? 'px-3 py-6' : 'px-6 py-14'
      }`}
    >
      {Icon && (
        <div className="grid h-10 w-10 place-items-center rounded-full bg-raised text-faint">
          <Icon size={18} />
        </div>
      )}
      <p className={`font-medium text-muted ${compact ? 'text-xs' : 'text-sm'}`}>{title}</p>
      {hint && <p className={`text-faint ${compact ? 'text-[11px]' : 'text-xs'}`}>{hint}</p>}
    </div>
  )
}
