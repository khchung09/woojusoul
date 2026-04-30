import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const sizeStyles: Record<"sm" | "md" | "lg", React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "13px" },
  md: { padding: "9px 18px", fontSize: "14px" },
  lg: { padding: "13px 24px", fontSize: "15px" },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, disabled, style, ...props }, ref) => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      borderRadius: "var(--r-pill)",
      fontWeight: 600,
      fontFamily: "inherit",
      border: "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      transition: "transform 0.12s ease, opacity 0.12s ease",
      opacity: disabled || loading ? 0.5 : 1,
      outline: "none",
      ...sizeStyles[size],
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: "var(--accent)",
        color: "white",
      },
      secondary: {
        background: "var(--surface)",
        color: "var(--text-primary)",
        border: "1.5px solid var(--border)",
      },
      danger: {
        background: "var(--danger)",
        color: "white",
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ ...base, ...variantStyles[variant], ...style }}
        onMouseDown={(e) => {
          if (!disabled && !loading) {
            (e.currentTarget as HTMLElement).style.transform = "scale(0.95)";
          }
          props.onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          props.onMouseUp?.(e);
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          props.onMouseLeave?.(e);
        }}
        {...props}
      >
        {loading && (
          <svg
            style={{ animation: "spin 0.8s linear infinite", width: "16px", height: "16px" }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
