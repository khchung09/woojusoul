import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {label && (
          <label
            htmlFor={id}
            style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          style={{
            borderRadius: "var(--r-md)",
            border: error
              ? "1.5px solid var(--danger)"
              : focused
              ? "1.5px solid var(--accent)"
              : "1.5px solid var(--border)",
            background: "var(--surface)",
            padding: "11px 14px",
            fontSize: "14px",
            color: "var(--text-primary)",
            fontFamily: "inherit",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            boxShadow: focused
              ? error
                ? "0 0 0 3px rgba(192,57,43,0.1)"
                : "0 0 0 3px rgba(45,80,22,0.08)"
              : "none",
            ...style,
          }}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={props.placeholder}
          {...props}
        />
        {error && (
          <p style={{ fontSize: "12px", color: "var(--danger)", margin: 0 }}>{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
