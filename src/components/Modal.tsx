import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Hides the close affordance for celebrations that own the moment. */
  bare?: boolean
}

export function Modal({ open, onClose, title, children, bare = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Stop the page behind the sheet from scrolling on touch devices.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-surface safe-bottom max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-swan bg-night p-5 shadow-xl animate-pop-in sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {!bare && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-hare hover:bg-polar"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
