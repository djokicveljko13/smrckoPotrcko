import { MAX_ORDER_NOTE } from "@/lib/order-validation";
import { fieldClass } from "@/lib/ui";

type CourierNoteFieldProps = {
  error?: string;
  placeholder?: string;
};

/**
 * Sklopljeno da ne smeta kad nema šta da se kaže kuriru.
 * Ime polja je uvek `note` — server ga čita iz FormData.
 */
export function CourierNoteField({
  error,
  placeholder = "Npr. ostavi kod komšije, prilog za poručenu hranu…",
}: CourierNoteFieldProps) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none font-display text-base font-extrabold uppercase tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span className="text-zinc-400 transition group-open:rotate-90">▸</span>
          Napomena za Potrčka
          <span className="font-sans text-xs font-medium normal-case tracking-normal text-zinc-500">
            (opciono)
          </span>
        </span>
      </summary>
      <textarea
        name="note"
        maxLength={MAX_ORDER_NOTE}
        rows={3}
        className={`${fieldClass} mt-3 resize-y`}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="mt-1 text-xs text-brand-dark">{error}</p> : null}
    </details>
  );
}
