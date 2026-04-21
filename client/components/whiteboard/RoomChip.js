import {
  RoomChipButton,
  RoomChipCard,
  RoomChipCode,
  RoomChipLabel,
  RoomChipMeta
} from "./styles";

function RoomChip({ participantCount, roomId, onShareCode }) {
  return (
    <RoomChipCard>
      <RoomChipLabel>Room ID</RoomChipLabel>
      <RoomChipCode>{roomId}</RoomChipCode>
      <RoomChipMeta>
        {participantCount} {participantCount === 1 ? "person" : "people"} in room
      </RoomChipMeta>
      <RoomChipButton type="button" onClick={onShareCode}>
        Copy ID
      </RoomChipButton>
    </RoomChipCard>
  );
}

export default RoomChip;
