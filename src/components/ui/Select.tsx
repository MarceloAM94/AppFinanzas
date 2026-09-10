import { type SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = "", children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-muted">{label}</label>
        )}
        <select
          ref={ref}
          className={`h-10 rounded-md bg-surface-elevated border border-hairline px-3 text-sm text-body
            focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20
            transition-colors appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
