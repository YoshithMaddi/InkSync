import { encodeRoomId } from "./roomId";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export async function createRoom() {
  const response = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });

  return parseResponse(response);
}

export async function fetchRoom(roomId) {
  const response = await fetch(`${API_URL}/rooms/${encodeRoomId(roomId)}`, {
    cache: "no-store"
  });

  return parseResponse(response);
}

export { API_URL };
