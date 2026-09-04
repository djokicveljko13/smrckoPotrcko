import type { OrderSource, OrderStatus } from "@/lib/types";

export const SOURCE_LABEL: Record<OrderSource, string> = {
  sajt: "Sa sajta",
  telefon: "Sa telefona",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  nova: "Nova",
  poslata_kuriru: "Poslata kuriru",
  krenuo: "Krenuo",
  isporuceno: "Isporučeno",
};

export function formatBoardTime(iso: string): string {
  return new Date(iso).toLocaleString("sr-RS", {
    timeZone: "Europe/Belgrade",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
