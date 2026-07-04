"use client"

import * as React from "react"
import { MinusIcon } from "lucide-react"

function InputOTPSeparator({ ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-otp-separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      aria-hidden="true"
      {...props}
    >
      <MinusIcon />
    </span>
  )
}

export { InputOTPSeparator }
