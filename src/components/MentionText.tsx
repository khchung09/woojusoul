import Link from "next/link";

type Props = { text: string; className?: string; style?: React.CSSProperties };

export function MentionText({ text, className, style }: Props) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p className={className} style={style}>
      {parts.map((part, i) =>
        /^@\w+$/.test(part) ? (
          <Link
            key={i}
            href={`/profile/by-username/${part.slice(1)}`}
            style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}
