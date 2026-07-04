import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const sectionVariants = cva("", {
  variants: {
    padding: {
      none: "",
      sm: "py-4",
      md: "py-8",
      lg: "py-12",
      xl: "py-16",
    },
    variant: {
      default: "",
      muted: "bg-muted/50",
      card: "rounded-lg border bg-card text-card-foreground shadow-sm",
    },
  },
  defaultVariants: {
    padding: "md",
    variant: "default",
  },
})

interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: "section" | "article" | "aside" | "div"
}

export function Section({ className, padding, variant, as: Tag = "section", ...props }: SectionProps) {
  return <Tag className={cn(sectionVariants({ padding, variant, className }))} {...props} />
}
