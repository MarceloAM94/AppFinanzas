import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-muted">{label}</label>
        )}
        <input
          ref={ref}
          className={`h-10 rounded-md bg-surface-elevated border border-hairline px-3 text-sm text-body
            placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
            transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
