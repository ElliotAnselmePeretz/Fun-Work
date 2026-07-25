import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

const FIELD_CLASS =
  'w-full rounded-2xl border-2 border-swan bg-white px-4 py-3 text-base font-bold ' +
  'outline-none transition-colors placeholder:font-normal placeholder:text-hare focus:border-sky'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextField({ label, className = '', ...rest }: TextFieldProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
      )}
      <input className={`${FIELD_CLASS} ${className}`} {...rest} />
    </label>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function TextArea({ label, className = '', ...rest }: TextAreaProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
      )}
      <textarea
        className={`${FIELD_CLASS} font-mono text-sm leading-relaxed ${className}`}
        {...rest}
      />
    </label>
  )
}
