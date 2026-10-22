import { rupeeParts } from '../lib/format'

/** ₹1,976<small>.00</small> — the design's big number with muted paise. */
export function Money({ value, className = '', prefix = '' }: { value: number; className?: string; prefix?: string }) {
  const [whole, frac] = rupeeParts(value)
  return (
    <span className={`money ${className}`}>
      {prefix}
      {whole}
      <span className="frac">{frac}</span>
    </span>
  )
}
