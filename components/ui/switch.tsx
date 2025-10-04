'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  size?: 'default' | 'sm'
}

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-4 w-6' : 'h-[1.15rem] w-8',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-white pointer-events-none block rounded-full ring-0 transition-transform shadow-sm',
          size === 'sm' ? 'size-3 data-[state=checked]:translate-x-[calc(100%-1px)] data-[state=unchecked]:translate-x-0' : 'size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
