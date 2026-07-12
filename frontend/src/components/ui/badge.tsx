import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-env-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-env-primary text-white shadow-sm",
        secondary:
          "border-transparent bg-bg text-text-primary",
        destructive:
          "border-transparent bg-danger text-white shadow-sm",
        outline: "text-text-primary border-border",
        env: "border-transparent bg-env-light text-env-primary",
        social: "border-transparent bg-social-light text-social-primary",
        gov: "border-transparent bg-gov-light text-gov-primary",
        game: "border-transparent bg-game-light text-game-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
