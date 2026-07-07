import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border border-black/10 bg-black/[0.02] px-3.5 py-2.5 text-sm text-aiventra-ink outline-none focus:border-aiventra-orange/50 focus:ring-2 focus:ring-aiventra-orange/15 disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldClass, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(fieldClass, "min-h-[80px] resize-none", className)} {...props} />
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldClass, className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-black/50">{label}</span>
      {children}
    </label>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</div>;
}
