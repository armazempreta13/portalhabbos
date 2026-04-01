import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-600 hover:shadow-purple-600/40",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border border-purple-200 bg-transparent hover:bg-purple-50 hover:border-purple-300 text-purple-600",
        secondary: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        ghost: "hover:bg-purple-50 hover:text-purple-600 text-gray-600",
        link: "text-purple-500 underline-offset-4 hover:underline",
        vip: "bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-purple-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }