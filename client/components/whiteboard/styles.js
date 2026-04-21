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

export const TextEditor = styled.textarea`
  position: absolute;
  min-width: 180px;
  min-height: 52px;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--text);
  resize: none;
  outline: none;
  transform: translate(-6px, -6px);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.14);
  font: inherit;
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
  width: 92px;
  padding: 12px;
  border-radius: 24px;
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
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  padding: 0;
  font-weight: 600;
  cursor: pointer;

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
    width: 22px;
    height: 22px;
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
