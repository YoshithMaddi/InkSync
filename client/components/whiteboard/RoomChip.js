function RoomChip({ participantCount, roomId, onShareCode }) {
  return (
    <aside className="room-chip card">
      <div className="room-chip-label">Room ID</div>
      <div className="room-chip-code">{roomId}</div>
      <div className="room-chip-meta">
        {participantCount} {participantCount === 1 ? "person" : "people"} in room
      </div>
      <button className="room-chip-button" type="button" onClick={onShareCode}>
        Copy ID
      </button>
    </aside>
  );
}

export default RoomChip;
