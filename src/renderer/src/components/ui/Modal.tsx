import { useEffect, useRef, useCallback, ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import X from 'lucide-react/dist/esm/icons/x'

function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  maxWidth?: string
  zIndex?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = 'max-w-lg',
  zIndex = 'z-50'
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    contentRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 bg-black/50 flex items-center justify-center p-4',
        'overscroll-behavior-contain',
        zIndex
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          'w-full outline-none bg-white dark:bg-slate-800 rounded-xl shadow-xl',
          'animate-in zoom-in-95 duration-200',
          'overscroll-behavior-contain overflow-y-auto max-h-[90vh]',
          maxWidth,
          className
        )}
      >
        {title && (
          <div className="flex justify-between items-center px-6 pt-6 pb-0">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
