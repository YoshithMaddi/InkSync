"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, fetchRoom } from "../lib/api";

function normalizeRoomCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export default function LobbyCard() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("Create a room or enter a code to join one.");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateRoom() {
    try {
      setIsLoading(true);
      setStatus("Creating a room...");
      const data = await createRoom();
      router.push(`/room/${data.roomId}`);
    } catch (error) {
      setStatus(error.message || "Could not create a room.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinRoom(event) {
    event.preventDefault();
    const nextRoomCode = normalizeRoomCode(roomCode);

    if (nextRoomCode.length !== 6) {
      setStatus("Enter a valid 6-character room code.");
      return;
    }

    try {
      setIsLoading(true);
      setStatus("Checking room...");
      await fetchRoom(nextRoomCode);
      router.push(`/room/${nextRoomCode}`);
    } catch (error) {
      setStatus(error.message || "Room not found. Create one first.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card lobby-card">
      <p className="eyebrow">Whiteboard Room</p>
      <h2>Create or join a room</h2>
      <div className="stack">
        <button className="primary-btn full-width" onClick={handleCreateRoom} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Room"}
        </button>

        <form className="stack" onSubmit={handleJoinRoom}>
          <label className="field" htmlFor="roomCode">
            Join with a room code
            <div className="row">
              <input
                id="roomCode"
                className="text-input room-input"
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
                placeholder="AB12CD"
                autoComplete="off"
                maxLength={6}
              />
              <button className="secondary-btn" type="submit">
                {isLoading ? "..." : "Join"}
              </button>
            </div>
          </label>
        </form>
      </div>
      <p className="status">{status}</p>
    </section>
  );
}
