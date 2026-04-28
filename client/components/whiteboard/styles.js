import Link from "next/link";
import styled, { css } from "styled-components";

const cardSurface = css`
  background: var(--card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
`;

const controlSurface = css`
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
`;

export const BoardShell = styled.main`
  position: relative;
  min-height: 100vh;
`;

export const BackFab = styled(Link)`
  position: fixed;
  left: 18px;
  top: 18px;
  z-index: 35;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.14);
  color: var(--text);

  svg {
    width: 22px;
    height: 22px;
  }

  &:hover span {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  @media (max-width: 720px) {
    left: 14px;
    top: 14px;
  }
`;

export const BackFabText = styled.span`
  position: absolute;
  left: 58px;
  top: 50%;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  color: white;
  font-size: 0.88rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) translateX(-4px);
  transition: opacity 140ms ease, transform 140ms ease;

  @media (max-width: 720px) {
    display: none;
  }
`;

export const CanvasStage = styled.section`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

export const CanvasStack = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const CanvasSurface = styled.canvas`
  width: 100vw;
  height: 100vh;
  display: block;
  border-radius: 0;
  background: #fffefb;
  touch-action: none;
  cursor: ${({ $activeTool }) => {
    if ($activeTool === "hand") return "grab";
    if ($activeTool === "eraser") return "crosshair";
    if ($activeTool === "text") return "text";
    return "crosshair";
  }};

  &:active {
    cursor: ${({ $activeTool }) => ($activeTool === "hand" ? "grabbing" : "inherit")};
  }
`;

export const RoomErrorToast = styled.div`
  ${cardSurface};
  position: absolute;
  left: 50%;
  top: 24px;
  z-index: 20;
  width: min(420px, calc(100vw - 32px));
  padding: 16px 18px;
  transform: translateX(-50%);
  border-radius: 22px;
`;

export const RoomErrorTitle = styled.div`
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
`;

export const RoomErrorCopy = styled.div`
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text);
`;

export const TextEditor = styled.div`
  position: absolute;
  z-index: 30;
  min-width: 80px;
  min-height: 28px;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text);
  outline: none;
  transform: translate(-6px, -6px);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.14);
  font: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;

  &:empty::before {
    content: attr(data-placeholder);
    color: rgba(15, 23, 42, 0.38);
  }
`;

export const TextToolbar = styled.div`
  ${cardSurface};
  position: absolute;
  z-index: 31;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 16px;
  background: rgba(255, 252, 246, 0.92);
  transform: translate(-50%, calc(-100% - 14px));
`;

export const TextToolbarButton = styled.button`
  ${controlSurface};
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  color: var(--text);
  font: inherit;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  background: ${({ $active }) => ($active ? "var(--accent-soft)" : "rgba(255, 255, 255, 0.82)")};
  cursor: pointer;
`;

export const TextToolbarLabel = styled.span`
  font-size: 0.8rem;
  color: var(--muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const RightDock = styled.div`
  position: fixed;
  right: 22px;
  top: 18px;
  z-index: 32;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;

  @media (max-width: 720px) {
    right: 14px;
    top: 14px;
  }
`;

export const LeftDock = styled.div`
  position: fixed;
  left: 22px;
  top: 80px;
  z-index: 32;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  @media (max-width: 720px) {
    left: 14px;
    top: 76px;
  }
`;

export const RoomChipCard = styled.aside`
  ${cardSurface};
  min-width: 180px;
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  border-radius: 22px;

  @media (max-width: 720px) {
    min-width: 156px;
  }
`;

export const RoomInfoWrap = styled.div`
  position: relative;
`;

export const DesktopRoomCard = styled(RoomChipCard)`
  @media (max-width: 720px) {
    display: none;
  }
`;

export const MobileRoomCard = styled(RoomChipCard)`
  display: none;

  @media (max-width: 720px) {
    display: ${({ $visible }) => ($visible ? "grid" : "none")};
    min-width: min(220px, calc(100vw - 92px));
    gap: 10px;
    padding: 14px;
    border-radius: 24px;
    background: rgba(255, 252, 246, 0.78);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
    animation: roomInfoFloatIn 250ms ease-in-out;
  }

  @keyframes roomInfoFloatIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

export const RoomInfoChip = styled.button`
  ${cardSurface};
  display: none;

  @media (max-width: 720px) {
    display: ${({ $visible }) => ($visible ? "inline-flex" : "none")};
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(255, 252, 246, 0.74);
    color: var(--text);
    font: inherit;
    cursor: pointer;
    transition: transform 250ms ease-in-out, opacity 250ms ease-in-out;

    &:active {
      transform: scale(0.98);
    }
  }
`;

export const RoomInfoChipCount = styled.span`
  font-size: 0.92rem;
  font-weight: 600;
`;

export const RoomInfoChipArrow = styled.span`
  font-size: 0.9rem;
  color: var(--muted);
`;

export const BottomSheetBackdrop = styled.button`
  position: fixed;
  inset: 0;
  z-index: 44;
  border: none;
  background: rgba(15, 23, 42, 0.18);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
  transition: opacity 250ms ease-in-out;

  @media (min-width: 721px) {
    display: none;
  }
`;

export const BottomSheet = styled.div`
  ${cardSurface};
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 45;
  padding: 14px;
  border-radius: 28px;
  background: rgba(255, 252, 246, 0.88);
  transform: translateY(${({ $open }) => ($open ? "0" : "115%")});
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
  transition: transform 250ms ease-in-out, opacity 250ms ease-in-out;

  @media (min-width: 721px) {
    display: none;
  }
`;

export const BottomSheetHandle = styled.div`
  width: 44px;
  height: 5px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.14);
`;

export const RoomInfoSection = styled.div`
  display: grid;
  gap: 8px;
`;

export const RoomInfoActions = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 10px;
`;

export const RoomChipLabel = styled.div`
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
`;

export const RoomChipCode = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
`;

export const RoomChipMeta = styled.div`
  font-size: 0.92rem;
  color: var(--muted);
`;

export const RoomChipSubMeta = styled.div`
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.68);
`;

export const RoomChipButton = styled.button`
  ${controlSurface};
  color: var(--text);
  padding: 10px 12px;
  cursor: pointer;
  font: inherit;
`;

export const ToolboxCard = styled.section`
  ${cardSurface};
  width: 80px;
  padding: 9px;
  border-radius: 20px;
  
`;

export const DesktopToolboxCard = styled(ToolboxCard)`
  @media (max-width: 720px) {
    display: none;
  }
`;

export const MobileToolEdge = styled.button`
  ${cardSurface};
  display: none;

  @media (max-width: 720px) {
    display: inline-flex;
    width: 40px;
    min-height: 112px;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
    border-radius: 0 18px 18px 0;
    background: rgba(255, 252, 246, ${({ $dimmed }) => ($dimmed ? 0.38 : 0.56)});
    color: var(--text);
    opacity: ${({ $open, $dimmed }) => ($open ? 0 : $dimmed ? 0.46 : 0.72)};
    pointer-events: ${({ $open }) => ($open ? "none" : "auto")};
    transition: opacity 220ms ease-in-out, transform 220ms ease-in-out;
    transform: ${({ $open }) => ($open ? "translateX(-8px)" : "translateX(0)")};
  }
`;

export const MobileToolbarBackdrop = styled.button`
  display: none;

  @media (max-width: 720px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    border: none;
    background: transparent;
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
  }
`;

export const MobileToolRail = styled.section`
  ${cardSurface};
  display: none;

  @media (max-width: 720px) {
    display: flex;
    position: fixed;
    left: 14px;
    top: 86px;
    z-index: 41;
    flex-direction: column;
    gap: 8px;
    width: 80px;
    padding: 10px 8px;
    border-radius: 24px;
    background: rgba(255, 252, 246, 0.84);
    transform: translateX(${({ $open }) => ($open ? "0" : "-112px")});
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
    transition: transform 230ms ease-in-out, opacity 230ms ease-in-out;
  }
`;

export const MobileRailLabel = styled.div`
  display: none;

  @media (max-width: 720px) {
    display: block;
    padding: 2px 4px 6px;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
`;

export const HistoryDock = styled.div`
  display: none;

  @media (max-width: 720px) {
    display: flex;
    position: fixed;
    right: 14px;
    bottom: 126px;
    z-index: 34;
    flex-direction: column;
    gap: 10px;
  }
`;

export const MobileContextPanel = styled.section`
  ${cardSurface};
  display: none;

  @media (max-width: 720px) {
    display: ${({ $visible }) => ($visible ? "grid" : "none")};
    position: fixed;
    left: 14px;
    right: 74px;
    bottom: 18px;
    z-index: 34;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 24px;
    background: rgba(255, 252, 246, 0.82);
    animation: mobileContextFloatIn 220ms ease-in-out;
  }

  @keyframes mobileContextFloatIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const MobileContextLabel = styled.div`
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
`;

export const MobileControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const MobileColorButton = styled.label`
  ${controlSurface};
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const MobileColorInput = styled.input`
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
`;

export const MobileRangeWrap = styled.label`
  ${controlSurface};
  min-height: 46px;
  flex: 1;
  display: grid;
  align-items: center;
  padding: 0 12px;
`;

export const MobileRange = styled.input`
  width: 100%;
`;

export const ToolboxHeader = styled.div`
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const ToolboxBadge = styled.div`
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255, 216, 199, 0.7);
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const ToolButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 10px;
`;

export const ToolboxControls = styled.div`
  display: grid;
  gap: 10px;
`;

export const ToolButton = styled.button`
  ${controlSurface};
  width: 100%;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  padding: 0;
  font-weight: 600;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};

  ${({ $active }) =>
    $active
      ? css`
          background: var(--accent-soft);
        `
      : null}

  ${({ $danger }) =>
    $danger
      ? css`
          background: rgba(255, 107, 53, 0.12);
        `
      : null}

  ${({ $fullWidth }) =>
    $fullWidth
      ? css`
          width: 100%;
        `
      : null}

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ToolSlider = styled.label`
  ${controlSurface};
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 10px 8px;
`;

export const ToolSliderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const VerticalRange = styled.input`
  width: 20px;
  height: 90px;
  writing-mode: vertical-lr;
  direction: rtl;
`;

export const ColorButton = styled.label`
  ${controlSurface};
  width: 100%;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const ColorInput = styled.input`
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  background: transparent;
`;
