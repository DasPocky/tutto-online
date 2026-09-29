import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg bg-black/20 px-4 text-base text-foreground ring-2 ring-inset ring-input outline-none transition placeholder:text-muted-foreground focus-visible:ring-ring disabled:opacity-50 aria-invalid:ring-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
