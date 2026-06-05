/** Chaves no localStorage para login rápido no celular */
const PHONE_KEY = "spfc_phone";
const HAS_PIN_KEY = "spfc_has_pin";

export function getSavedPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PHONE_KEY);
}

export function savePhone(phone: string) {
  localStorage.setItem(PHONE_KEY, phone);
}

export function hasSavedPin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HAS_PIN_KEY) === "true";
}

export function markPinSet() {
  localStorage.setItem(HAS_PIN_KEY, "true");
}

export function clearPinFlag() {
  localStorage.removeItem(HAS_PIN_KEY);
}
