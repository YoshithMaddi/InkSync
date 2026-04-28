import { useEffect, useRef, useState } from "react";
import {
  BottomSheet,
  BottomSheetBackdrop,
  BottomSheetHandle,
  DesktopRoomCard,
  MobileRoomCard,
  RoomChipButton,
  RoomChipCode,
  RoomChipLabel,
  RoomChipMeta,
  RoomChipSubMeta,
  RoomInfoActions,
  RoomInfoChip,
  RoomInfoChipArrow,
  RoomInfoChipCount,
  RoomInfoSection,
  RoomInfoWrap
} from "./styles";

function RoomInfoContent({ participantCount, roomId, zoomLabel, onResetView, onShareCode }) {
  return (
    <>
      <RoomInfoSection>
        <RoomChipLabel>Room ID</RoomChipLabel>
        <RoomChipCode>{roomId}</RoomChipCode>
        <RoomChipMeta>
          {participantCount} {participantCount === 1 ? "person" : "people"} in room
        </RoomChipMeta>
        <RoomChipSubMeta>{zoomLabel}</RoomChipSubMeta>
      </RoomInfoSection>

      <RoomInfoActions>
        <RoomChipButton type="button" onClick={onResetView}>
          Reset view
        </RoomChipButton>
        <RoomChipButton type="button" onClick={onShareCode}>
          Copy ID
        </RoomChipButton>
      </RoomInfoActions>
    </>
  );
}

function RoomChip({ participantCount, roomId, zoomLabel, onResetView, onShareCode }) {
  const autoCollapseTimerRef = useRef(null);
  const interactedRef = useRef(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function clearAutoCollapseTimer() {
    if (autoCollapseTimerRef.current) {
      window.clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  }

  function cancelAutoCollapse() {
    interactedRef.current = true;
    clearAutoCollapseTimer();
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.matchMedia("(max-width: 720px)").matches || interactedRef.current) {
      return undefined;
    }

    clearAutoCollapseTimer();
    autoCollapseTimerRef.current = window.setTimeout(() => {
      if (!interactedRef.current) {
        setIsCollapsed(true);
      }
    }, 4000);

    return () => {
      clearAutoCollapseTimer();
    };
  }, []);

  function handlePrimaryAction(action) {
    cancelAutoCollapse();
    action();
  }

  function openSheet() {
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
  }

  function collapseCard() {
    cancelAutoCollapse();
    setIsCollapsed(true);
    setIsSheetOpen(false);
  }

  return (
    <RoomInfoWrap>
      <DesktopRoomCard>
        <RoomInfoContent
          participantCount={participantCount}
          roomId={roomId}
          zoomLabel={zoomLabel}
          onResetView={() => handlePrimaryAction(onResetView)}
          onShareCode={() => handlePrimaryAction(onShareCode)}
        />
      </DesktopRoomCard>

      <MobileRoomCard
        $visible={!isCollapsed}
        onPointerDown={cancelAutoCollapse}
        onDoubleClick={collapseCard}
      >
        <RoomInfoContent
          participantCount={participantCount}
          roomId={roomId}
          zoomLabel={zoomLabel}
          onResetView={() => handlePrimaryAction(onResetView)}
          onShareCode={() => handlePrimaryAction(onShareCode)}
        />
      </MobileRoomCard>

      <RoomInfoChip
        type="button"
        $visible={isCollapsed}
        onClick={openSheet}
        aria-label="Open room info"
      >
        <RoomInfoChipCount>
          {"\uD83D\uDC65"} {participantCount}
        </RoomInfoChipCount>
        <RoomInfoChipArrow>{"\u2303"}</RoomInfoChipArrow>
      </RoomInfoChip>

      <BottomSheetBackdrop
        type="button"
        $open={isSheetOpen}
        onClick={closeSheet}
        aria-label="Close room info"
      />

      <BottomSheet $open={isSheetOpen}>
        <BottomSheetHandle />
        <RoomInfoContent
          participantCount={participantCount}
          roomId={roomId}
          zoomLabel={zoomLabel}
          onResetView={() => handlePrimaryAction(onResetView)}
          onShareCode={() => handlePrimaryAction(onShareCode)}
        />
        <RoomInfoActions>
          <RoomChipButton type="button" onClick={closeSheet}>
            Done
          </RoomChipButton>
        </RoomInfoActions>
      </BottomSheet>
    </RoomInfoWrap>
  );
}

export default RoomChip;
