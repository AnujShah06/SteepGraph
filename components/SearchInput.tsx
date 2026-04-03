"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  onSearch: (q: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  onSearch,
  placeholder = "Search teas…",
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onSearch]);

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.icon}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        spellCheck={false}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => setValue("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
