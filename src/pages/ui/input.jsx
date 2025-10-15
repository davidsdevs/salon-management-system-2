import * as React from "react"

import { cn } from "../../lib/utils"

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base sizing preserved (do not change height)
        "flex h-9 w-full min-w-0",
        // Field visuals to match landing theme
        "rounded-lg border border-gray-300 bg-white px-4 text-base placeholder:text-gray-400 shadow-sm transition-[color,box-shadow] outline-none",
        // File input defaults
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Focus ring to brand color without changing size
        "focus-visible:border-[#160B53] focus-visible:ring-[#160B53]/30 focus-visible:ring-[3px]",
        // Invalid state
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }





