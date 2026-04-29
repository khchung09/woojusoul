"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type UserSuggestion = { id: string; username: string; avatar_url: string | null };

function getMentionContext(
  text: string,
  cursor: number
): { query: string; start: number } | null {
  const before = text.slice(0, cursor);
  const atIdx = before.lastIndexOf("@");
  if (atIdx === -1) return null;
  const fragment = before.slice(atIdx + 1);
  if (fragment.length === 0 || /[\s\n]/.test(fragment)) return null;
  if (!/^\w+$/.test(fragment)) return null;
  return { query: fragment, start: atIdx };
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  wrapperClassName?: string;
  className?: string;
  autoFocus?: boolean;
};

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  rows = 3,
  maxLength,
  disabled,
  wrapperClassName = "",
  className = "",
  autoFocus,
}: Props) {
  const [ctx, setCtx] = useState<{ query: string; start: number } | null>(null);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [selIdx, setSelIdx] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ctx || ctx.query.length === 0) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `${ctx.query}%`)
      .limit(6)
      .then(({ data }) => {
        if (!cancelled) setSuggestions((data ?? []) as UserSuggestion[]);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx?.query]);

  useEffect(() => {
    setSelIdx(0);
  }, [suggestions]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newVal = e.target.value;
    const cursor = e.target.selectionStart ?? newVal.length;
    onChange(newVal);
    setCtx(getMentionContext(newVal, cursor));
  }

  function handleClick(e: React.MouseEvent<HTMLTextAreaElement>) {
    const cursor = e.currentTarget.selectionStart ?? value.length;
    setCtx(getMentionContext(value, cursor));
  }

  function insertMention(user: UserSuggestion) {
    if (!ctx) return;
    const ta = taRef.current;
    const cursor = ta?.selectionStart ?? value.length;
    const before = value.slice(0, ctx.start);
    const after = value.slice(cursor);
    const newVal = `${before}@${user.username} ${after}`;
    onChange(newVal);
    setCtx(null);
    setSuggestions([]);
    const newCursor = ctx.start + user.username.length + 2;
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newCursor, newCursor);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selIdx]);
        return;
      }
      if (e.key === "Escape") {
        setCtx(null);
        setSuggestions([]);
        return;
      }
    }
    onKeyDown?.(e);
  }

  const showDropdown = ctx !== null && suggestions.length > 0;

  return (
    <div className={`relative ${wrapperClassName}`}>
      {showDropdown && (
        <div className="absolute bottom-full left-0 right-0 mb-1 z-50 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((user, i) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  i === selIdx ? "bg-amber-50" : "hover:bg-stone-50"
                }`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                <span
                  className={`font-medium ${
                    i === selIdx ? "text-amber-700" : "text-stone-700"
                  }`}
                >
                  @{user.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className}
      />
    </div>
  );
}
