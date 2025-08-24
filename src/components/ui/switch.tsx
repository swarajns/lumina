"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      // RED when OFF (unchecked)
      "data-[state=unchecked]:bg-red-500/20 data-[state=unchecked]:border-red-500/30",
      // GREEN when ON (checked)  
      "data-[state=checked]:bg-green-500/20 data-[state=checked]:border-green-500/30",
      // Add the switch-toggle class for your custom CSS
      "switch-toggle",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform",
        // RED thumb when OFF
        "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-red-600",
        // GREEN thumb when ON
        "data-[state=checked]:translate-x-5 data-[state=checked]:bg-green-600"
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
