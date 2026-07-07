"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[71] max-h-[86vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-black/[0.06] bg-white p-6 shadow-lift",
          className
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <DialogPrimitive.Title className="font-display text-lg font-bold text-aiventra-ink">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="mt-1 text-sm text-black/45">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-black/40 hover:bg-black/[0.05] hover:text-aiventra-ink">
            <X size={16} />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
