import Link from "next/link";

type Props = { text: string; className?: string };

export function MentionText({ text, className }: Props) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p className={className}>
      {parts.map((part, i) =>
        /^@\w+$/.test(part) ? (
          <Link
            key={i}
            href={`/profile/by-username/${part.slice(1)}`}
            className="font-medium text-[#6b7c2a] hover:underline"
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
