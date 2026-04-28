const CLIENT_ID_KEY = "inksync-client-id";

export function getOrCreateClientId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingClientId = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existingClientId) {
    return existingClientId;
  }

  const nextClientId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  window.localStorage.setItem(CLIENT_ID_KEY, nextClientId);
  return nextClientId;
}
