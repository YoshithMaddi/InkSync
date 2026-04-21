import WhiteboardRoom from "../../../components/WhiteboardRoom";
import { fetchRoom } from "../../../lib/api";

export default async function RoomPage({ params }) {
  const { roomId } = await params;
  const normalizedRoomId = roomId.toUpperCase();

  try {
    const room = await fetchRoom(normalizedRoomId);
    return (
      <WhiteboardRoom
        roomId={room.roomId}
        initialStrokes={room.strokes}
        initialTexts={room.texts}
        initialParticipantCount={room.participantCount}
        initialError=""
      />
    );
  } catch (error) {
    return (
      <WhiteboardRoom
        roomId={normalizedRoomId}
        initialStrokes={[]}
        initialTexts={[]}
        initialParticipantCount={0}
        initialError={error.message || "Could not load this room."}
      />
    );
  }
}
