import clsx from 'clsx'
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700',
        variant === 'secondary' &&
          'border border-stone-200 bg-white text-stone-800 hover:bg-stone-50',
        variant === 'ghost' && 'text-stone-700 hover:bg-stone-100/80',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
      {...props}
    />
  )
}

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-sm shadow-stone-200/50 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900 shadow-inner shadow-stone-100 outline-none ring-brand-500/20 placeholder:text-stone-400 focus:border-brand-400 focus:ring-2',
        className,
      )}
      {...props}
    />
  )
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'min-h-[100px] w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900 shadow-inner shadow-stone-100 outline-none ring-brand-500/20 placeholder:text-stone-400 focus:border-brand-400 focus:ring-2',
        className,
      )}
      {...props}
    />
  )
}
