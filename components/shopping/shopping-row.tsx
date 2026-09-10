"use client";

import { TrashIcon } from "@/components/icons";
import { MAX_ITEM_LEN } from "@/lib/shopping";

type ShoppingRowProps = {
  id: string;
  value: string;
  index: number;
  total: number;
  disabled?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export function ShoppingRow({
  id,
  value,
  index,
  total,
  disabled,
  inputRef,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ShoppingRowProps) {
  return (
    <div className="flex items-center gap-2 border-b border-dashed border-[#ddd3ba] py-2.5">
      <span
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-2 border-[#cbbf9e] bg-transparent"
      />
      <input
        ref={inputRef}
        id={id}
        name="items"
        value={value}
        maxLength={MAX_ITEM_LEN}
        disabled={disabled}
        placeholder={index === 0 && !value ? "Npr. 2x mleko…" : "Stavka…"}
        aria-label={`Stavka ${index + 1}`}
        className="min-w-0 flex-1 bg-transparent text-base font-medium text-ink outline-none placeholder:text-[#b5a882]"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter();
          } else if (event.key === "Backspace" && value === "") {
            event.preventDefault();
            onBackspaceEmpty();
          }
        }}
      />
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={onMoveUp}
          aria-label="Pomeri gore"
          className="rounded-md px-1.5 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={disabled || index >= total - 1}
          onClick={onMoveDown}
          aria-label="Pomeri dole"
          className="rounded-md px-1.5 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          disabled={disabled || (total === 1 && !value)}
          onClick={onRemove}
          aria-label="Obriši stavku"
          className="rounded-md p-1.5 text-zinc-400 hover:bg-brand/10 hover:text-brand disabled:opacity-30"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
