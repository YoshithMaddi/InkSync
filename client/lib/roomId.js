export const ROOM_LENGTH = 6;
export const ROOM_SYMBOLS = "@#$&(){}[]!";
export const ROOM_CHARSET = `ABCDEFGHJKLMNPQRSTUVWXYZ23456789${ROOM_SYMBOLS}`;
export const ROOM_CODE_PATTERN = new RegExp(`[^A-Z0-9${escapeForCharacterClass(ROOM_SYMBOLS)}]`, "g");

function escapeForCharacterClass(value) {
  return value.replace(/[\\\]\-^]/g, "\\$&");
}

export function normalizeRoomCode(value = "") {
  return value.trim().toUpperCase().replace(ROOM_CODE_PATTERN, "").slice(0, ROOM_LENGTH);
}

export function encodeRoomId(roomId) {
  return encodeURIComponent(roomId);
}
