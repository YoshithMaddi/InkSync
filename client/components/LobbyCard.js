"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom, fetchRoom } from "../lib/api";
import {
  Eyebrow,
  Field,
  FormStack,
  LobbyCardWrap,
  PrimaryButton,
  RoomInput,
  Row,
  SecondaryButton,
  Stack,
  Status
} from "./lobbyStyles";

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
    <LobbyCardWrap>
      <Eyebrow>InkSync by Yoshith</Eyebrow>
      <h2>Create or join a room</h2>
      <Stack>
        <PrimaryButton type="button" onClick={handleCreateRoom} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Room"}
        </PrimaryButton>

        <FormStack onSubmit={handleJoinRoom}>
          <Field htmlFor="roomCode">
            Join with a room code
            <Row>
              <RoomInput
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
                placeholder="AB12CD"
                autoComplete="off"
                maxLength={6}
              />
              <SecondaryButton type="submit">
                {isLoading ? "..." : "Join"}
              </SecondaryButton>
            </Row>
          </Field>
        </FormStack>
      </Stack>
      <Status>{status}</Status>
    </LobbyCardWrap>
  );
}
