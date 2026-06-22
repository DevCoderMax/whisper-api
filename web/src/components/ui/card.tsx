import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card P&B suavizado:
 * - fundo `muted` em vez do branco puro (descanso visual)
 * - hover faz borda engrossar + texto ascender ao foreground puro,
 *   em vez de inverter 100% (menos agressivo)
 * Sem sombras, sem cantos arredondados (radius=0).
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative flex flex-col gap-4 border border-foreground/80 bg-muted p-6 transition-all duration-150",
      "hover:border-foreground hover:bg-background",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display text-xl font-bold text-foreground",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-12 w-12 items-center justify-center border border-foreground/60 text-foreground transition-colors group-hover:border-foreground",
      className,
    )}
    {...props}
  />
));
CardIcon.displayName = "CardIcon";
