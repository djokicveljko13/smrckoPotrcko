"use client";

import { useEffect, useRef } from "react";
import { PlusIcon } from "@/components/icons";
import { ShoppingRow } from "@/components/shopping/shopping-row";
import { MAX_SHOPPING_ITEMS } from "@/lib/shopping";

export type PaperItem = { key: string; text: string };

type ShoppingPaperProps = {
  items: PaperItem[];
  onChange: (items: PaperItem[]) => void;
  error?: string;
  disabled?: boolean;
  focusKey?: string | null;
  onFocusHandled?: () => void;
};

let keySeq = 0;
export function newPaperItem(text = ""): PaperItem {
  keySeq += 1;
  return { key: `item-${keySeq}`, text };
}

export function ShoppingPaper({
  items,
  onChange,
  error,
  disabled,
  focusKey,
  onFocusHandled,
}: ShoppingPaperProps) {
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    if (!focusKey) return;
    const el = inputRefs.current.get(focusKey);
    el?.focus();
    onFocusHandled?.();
  }, [focusKey, onFocusHandled]);

  function updateAt(index: number, text: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, text } : item)));
  }

  function insertAfter(index: number) {
    if (items.length >= MAX_SHOPPING_ITEMS) return;
    const next = [...items];
    const created = newPaperItem();
    next.splice(index + 1, 0, created);
    onChange(next);
    // Fokus u sledećem ticku preko focusKey iz parenta — parent postavlja.
    queueMicrotask(() => {
      inputRefs.current.get(created.key)?.focus();
    });
  }

  function removeAt(index: number) {
    if (items.length === 1) {
      onChange([{ ...items[0], text: "" }]);
      queueMicrotask(() => inputRefs.current.get(items[0].key)?.focus());
      return;
    }
    const prev = items[Math.max(0, index - 1)];
    onChange(items.filter((_, i) => i !== index));
    queueMicrotask(() => inputRefs.current.get(prev.key)?.focus());
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  }

  const filled = items.filter((item) => item.text.trim()).length;

  return (
    <div
      className={[
        "rounded-2xl border border-[#e8e0cc] bg-[#fffdf7]",
        "shadow-[0_18px_45px_-24px_rgba(16,16,16,0.45)]",
        "px-4 py-5 sm:px-6 sm:py-6",
        "sm:-rotate-[0.4deg]",
      ].join(" ")}
    >
      <h2 className="font-display text-lg font-black italic uppercase tracking-tight sm:text-xl">
        Šta kupujemo danas?
      </h2>
      <p className="mt-1 text-sm font-medium text-[#73694f]">
        Napiši šta ti treba. Enter dodaje novi red.
      </p>

      <div className="mt-4" role="list" aria-label="Lista za kupovinu">
        {items.map((item, index) => (
          <div key={item.key} role="listitem">
            <ShoppingRow
              id={`shopping-item-${item.key}`}
              value={item.text}
              index={index}
              total={items.length}
              disabled={disabled}
              inputRef={(el) => {
                if (el) inputRefs.current.set(item.key, el);
                else inputRefs.current.delete(item.key);
              }}
              onChange={(text) => updateAt(index, text)}
              onEnter={() => insertAfter(index)}
              onBackspaceEmpty={() => removeAt(index)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onRemove={() => removeAt(index)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled || items.length >= MAX_SHOPPING_ITEMS}
          onClick={() => {
            if (items.length >= MAX_SHOPPING_ITEMS) return;
            const created = newPaperItem();
            onChange([...items, created]);
            queueMicrotask(() => inputRefs.current.get(created.key)?.focus());
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-bold text-brand-dark hover:bg-brand/10 disabled:opacity-40"
        >
          <PlusIcon className="h-4 w-4" />
          Dodaj stavku
        </button>
        <p className="text-xs font-bold text-[#73694f]" aria-live="polite">
          {filled}/{MAX_SHOPPING_ITEMS}
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-brand-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}
