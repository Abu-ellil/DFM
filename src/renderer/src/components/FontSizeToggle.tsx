'use client'

import { Minus, Plus, Type } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useEffect, useState } from 'react'

export function FontSizeToggle() {
  const { fontSize, increaseFontSize, decreaseFontSize } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedFontSize = parseInt(localStorage.getItem('fontSize') || '100')
    useAppStore.getState().setFontSize(savedFontSize)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={decreaseFontSize}
        className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="تصغير الخط"
        disabled={fontSize <= 85}
      >
        <Minus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
      <div className="flex items-center gap-1 px-2">
        <Type className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[45px]">
          {fontSize}%
        </span>
      </div>
      <button
        onClick={increaseFontSize}
        className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="تكبير الخط"
        disabled={fontSize >= 130}
      >
        <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  )
}
