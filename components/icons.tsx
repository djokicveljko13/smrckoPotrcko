/*
 * Ikonice kao inline SVG, bez biblioteke.
 *
 * Zašto ne lucide-react ili sličan paket: trebalo nam je 9 ikonica. Paket bi
 * doneo stotine njih i još jednu zavisnost koja se održava. SVG je običan JSX,
 * `currentColor` znači "uzmi boju teksta oko sebe" — pa se boja podešava
 * Tailwind klasom na roditelju, bez propa za boju.
 *
 * Sve su na 24x24 mreži, pa im veličinu daje className (npr. "h-4 w-4").
 */

type IconProps = { className?: string };

/** Zajednički atributi za linijske ikonice — iscrtane, ne pune. */
const strokeProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PackageIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
      <path d="m16.5 9.4-9-5.2" />
    </svg>
  );
}

export function StoreIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function HomeIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.37 1.6.7 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.73-1.27a2 2 0 0 1 2.11-.45c.75.33 1.54.57 2.35.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function BoltIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </svg>
  );
}

export function MapPinIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Strelica nadole na CTA dugmetu — nagoveštaj da klik vodi niže na stranici. */
export function ArrowDownIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

export function CheckCircleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg {...strokeProps} className={className} aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m22 4-10 10.01L9 11" />
    </svg>
  );
}

/*
 * WhatsApp i Viber su tuđi logotipi, pa su pune (fill) putanje sa svojom
 * bojom — poznati oblik i boja su ono po čemu ih ljudi prepoznaju.
 */

export function WhatsAppIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
      />
    </svg>
  );
}

export function ViberIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#7360F2"
        d="M12.04 2c-5.3 0-9.62 4.18-9.62 9.34 0 1.75.5 3.38 1.36 4.78L2 22l5.98-1.55A9.7 9.7 0 0 0 12.04 21.7c5.3 0 9.62-4.18 9.62-9.35S17.34 2 12.04 2zm4.52 13.54c-.19.54-1.1 1.03-1.52 1.07-.39.03-.76.16-2.56-.53-2.3-.88-3.78-3.2-3.9-3.35-.11-.15-.96-1.28-.96-2.44s.6-1.73.82-1.97c.2-.22.44-.28.59-.28h.43c.14 0 .32-.05.5.38.19.46.65 1.59.7 1.7.06.12.1.25.02.41-.08.15-.12.25-.24.38-.12.13-.25.29-.36.39-.12.1-.24.22-.1.43.14.22.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.15.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.13 1.12z"
      />
    </svg>
  );
}
