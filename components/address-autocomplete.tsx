"use client";

import { useEffect, useRef, useState } from "react";
import { HomeIcon, StoreIcon } from "@/components/icons";
import type { AddressSuggestion } from "@/lib/order-types";
import { DISPLAY_PHONE, TEL_URL } from "@/lib/contact";
import { fieldIconClass, fieldWithIconClass, labelClass } from "@/lib/ui";

type AddressAutocompleteProps = {
  name?: "address" | "shop";
  label?: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  initial?: { text: string; proof: string } | null;
  onSelect?: (selected: boolean) => void;
};

const CHOOSE_ADDRESS = "Izaberi adresu iz ponuđene liste.";

export function AddressAutocomplete({
  name = "address",
  label = "Gde donosimo?",
  placeholder = "Ulica i broj",
  maxLength = 400,
  error,
  initial,
  onSelect,
}: AddressAutocompleteProps) {
  const [text, setText] = useState(initial?.text ?? "");
  const [selection, setSelection] = useState<AddressSuggestion | null>(
    initial?.text && initial.proof
      ? { text: initial.text, placeId: initial.proof, proof: initial.proof }
      : null,
  );
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [invalid, setInvalid] = useState(false);
  const [retry, setRetry] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const focused = useRef(false);
  const picking = useRef(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoved = useRef(false);

  useEffect(() => {
    inputRef.current?.setCustomValidity(selection ? "" : CHOOSE_ADDRESS);
  }, [selection]);

  useEffect(() => () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
  }, []);

  useEffect(() => {
    if (selection || text.trim().length < 3) return;
    const currentRevision = revision.current;
    const controller = new AbortController();
    requestRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/adrese", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: text.trim() }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted || currentRevision !== revision.current) return;
        if (!res.ok || data.status !== "ok" || !Array.isArray(data.suggestions)) {
          throw new Error("Suggestions unavailable");
        }
        const list: AddressSuggestion[] = data.suggestions.filter(
          (item: AddressSuggestion) => typeof item?.text === "string" &&
            item.text.length <= maxLength && typeof item.placeId === "string" &&
            typeof item.proof === "string" && item.proof.length > 0,
        );
        setSuggestions(list);
        setStatus("ready");
        setActiveIndex(-1);
        setOpen(focused.current && list.length > 0);
      } catch {
        if (controller.signal.aborted || currentRevision !== revision.current) return;
        setSuggestions([]);
        setOpen(false);
        setStatus("error");
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, selection, retry, maxLength]);

  function clearBlurTimer() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  function pick(suggestion: AddressSuggestion) {
    clearBlurTimer();
    picking.current = false;
    revision.current += 1;
    requestRef.current?.abort();
    focused.current = true;
    setText(suggestion.text);
    setSelection(suggestion);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setStatus("idle");
    setInvalid(false);
    inputRef.current?.setCustomValidity("");
    inputRef.current?.focus({ preventScroll: true });
    onSelect?.(true);
  }

  /**
   * Zašto touchstart/mousedown, ne click:
   * Na iPhone-u redosled je touchstart → blur (lista nestane) → click.
   * Click onda pada u prazno. Ovi eventi idu PRE blur-a.
   */
  function chooseSuggestion(
    event: { preventDefault(): void; stopPropagation(): void },
    suggestion: AddressSuggestion,
  ) {
    event.preventDefault();
    event.stopPropagation();
    picking.current = true;
    pick(suggestion);
  }

  const message = invalid ? CHOOSE_ADDRESS : error;
  const listId = `${name}-suggestions`;
  const showHint =
    !selection &&
    !message &&
    text.trim().length >= 3 &&
    status === "ready" &&
    suggestions.length > 0;

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (picking.current) return;
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        clearBlurTimer();
        blurTimer.current = setTimeout(() => {
          if (picking.current) return;
          if (rootRef.current?.contains(document.activeElement)) return;
          focused.current = false;
          setOpen(false);
          if (text && !selection) setInvalid(true);
        }, 250);
      }}
    >
      <label htmlFor={name} className={labelClass}>{label}</label>
      <div className="relative mt-1.5">
        <span className={fieldIconClass}>{name === "shop" ? <StoreIcon /> : <HomeIcon />}</span>
        <input
          ref={inputRef}
          id={name}
          name={name}
          required
          maxLength={maxLength}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-invalid={Boolean(message)}
          aria-describedby={`${name}-feedback`}
          className={fieldWithIconClass}
          placeholder={placeholder}
          value={text}
          onInvalid={() => setInvalid(true)}
          onChange={(event) => {
            revision.current += 1;
            requestRef.current?.abort();
            setText(event.target.value);
            setSelection(null);
            setSuggestions([]);
            setOpen(false);
            setActiveIndex(-1);
            setInvalid(false);
            setStatus(event.target.value.trim().length >= 3 ? "loading" : "idle");
            event.target.setCustomValidity(CHOOSE_ADDRESS);
            onSelect?.(false);
          }}
          onFocus={() => {
            clearBlurTimer();
            focused.current = true;
            setOpen(suggestions.length > 0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
            } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => event.key === "ArrowDown"
                ? (index + 1) % suggestions.length
                : (index <= 0 ? suggestions.length - 1 : index - 1));
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              if (activeIndex >= 0) pick(suggestions[activeIndex]);
            }
          }}
        />
      </div>
      <input type="hidden" name={`${name}_selection`} value={selection?.proof ?? ""} />
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto overscroll-contain rounded-2xl border-2 border-zinc-200 bg-white shadow-lg [-webkit-overflow-scrolling:touch]"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.placeId} role="presentation">
              <button
                type="button"
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                tabIndex={-1}
                onTouchStart={(event) => {
                  picking.current = true;
                  touchStartY.current = event.touches[0]?.clientY ?? null;
                  touchMoved.current = false;
                }}
                onTouchMove={(event) => {
                  const startY = touchStartY.current;
                  const y = event.touches[0]?.clientY;
                  if (startY == null || y == null) return;
                  if (Math.abs(y - startY) > 10) {
                    touchMoved.current = true;
                    picking.current = false;
                  }
                }}
                onTouchEnd={(event) => {
                  if (touchMoved.current) {
                    touchStartY.current = null;
                    return;
                  }
                  chooseSuggestion(event, suggestion);
                }}
                onTouchCancel={() => {
                  picking.current = false;
                  touchStartY.current = null;
                }}
                onMouseDown={(event) => {
                  if (event.button !== 0) return;
                  chooseSuggestion(event, suggestion);
                }}
                className={`block w-full cursor-pointer px-4 py-3.5 text-left text-sm font-medium text-ink [touch-action:pan-y] hover:bg-brand/10 ${
                  index === activeIndex ? "bg-brand/10" : ""
                }`}
              >
                {suggestion.text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div id={`${name}-feedback`} aria-live="polite" className="mt-1 text-xs font-medium">
        {message ? <p className="text-brand-dark">{message}</p> : null}
        {showHint ? (
          <p className="text-zinc-600">Tapni predlog sa liste — samo kucanje nije dovoljno.</p>
        ) : null}
        {status === "loading" ? <p className="text-zinc-500">Tražim adrese…</p> : null}
        {status === "ready" && suggestions.length === 0 ? (
          <p className="text-zinc-600">
            Nema predloga. Probaj naziv ulice i mesto ili pozovi{" "}
            <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="text-brand-dark">
            Predlozi trenutno nisu dostupni.{" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => {
                setStatus("loading");
                setRetry((value) => value + 1);
              }}
            >
              Pokušaj ponovo
            </button>
            {" ili pozovi "}
            <a href={TEL_URL} className="underline">{DISPLAY_PHONE}</a>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
