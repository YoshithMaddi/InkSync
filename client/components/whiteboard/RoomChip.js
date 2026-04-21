import {
  RoomChipButton,
  RoomChipCard,
  RoomChipCode,
  RoomChipLabel,
  RoomChipMeta,
  RoomChipSubMeta
} from "./styles";

function RoomChip({ participantCount, roomId, zoomLabel, onResetView, onShareCode }) {
  return (
    <RoomChipCard>
      <RoomChipLabel>Room ID</RoomChipLabel>
      <RoomChipCode>{roomId}</RoomChipCode>
      <RoomChipMeta>
        {participantCount} {participantCount === 1 ? "person" : "people"} in room
      </RoomChipMeta>
      <RoomChipSubMeta>{zoomLabel}</RoomChipSubMeta>
      <RoomChipButton type="button" onClick={onResetView}>
        Reset view
      </RoomChipButton>
      <RoomChipButton type="button" onClick={onShareCode}>
        Copy ID
      </RoomChipButton>
    </RoomChipCard>
  );
}

export default RoomChip;
