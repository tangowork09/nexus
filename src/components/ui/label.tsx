'use client'

import * as React from 'react'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={`text-[11px] font-black uppercase tracking-[0.1em] text-indigo-600 ml-1 ${className || ''}`}
    >
      {children}
    </label>
  )
}
