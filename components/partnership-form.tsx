import { fieldClass, labelClass,primaryButtonClass  } from "@/lib/ui";

export function PartnershipForm() {
  return (
    <form className="mt-6 space-y-5">
      <div>
        <label htmlFor="company" className={labelClass}>
          Naziv firme
        </label>

        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          required
          maxLength={200}
          className={fieldClass}
        />
      </div>
      <div>
  <label htmlFor="phone" className={labelClass}>
    Telefon
  </label>

  <input
    id="phone"
    name="phone"
    type="tel"
    autoComplete="tel"
    required
    maxLength={40}
    className={fieldClass}
  />
</div>
<div>
  <label htmlFor="message" className={labelClass}>
    Poruka (opciono)
  </label>

  <textarea
    id="message"
    name="message"
    rows={3}
    maxLength={1000}
    placeholder="Opišite ukratko šta vam je potrebno."
    className={fieldClass}
  />
</div>
<button type="button" className={primaryButtonClass}>
  Pošalji upit
</button>
    </form>
  );
}