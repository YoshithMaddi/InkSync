import styled, { css } from "styled-components";

const cardSurface = css`
  background: var(--card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
`;

const buttonBase = css`
  border: none;
  border-radius: 18px;
  padding: 14px 18px;
  cursor: pointer;
  transition: transform 140ms ease, opacity 140ms ease, background 140ms ease;
  font: inherit;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.72;
  }

  @media (max-width: 720px) {
    padding: 12px 15px;
    border-radius: 16px;
  }
`;

export const LobbyShell = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;

  @media (max-width: 720px) {
    padding: 16px;
    align-content: center;
  }

  @media (max-width: 420px) {
    padding: 14px;
  }
`;

export const LobbyCenter = styled.section`
  width: min(100%, 520px);

  @media (max-width: 720px) {
    width: min(100%, 430px);
  }
`;

export const SignatureMark = styled.div`
  position: fixed;
  right: 22px;
  bottom: 18px;
  z-index: 10;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: rgba(15, 23, 42, 0.5);
  opacity: 0.6;
  transition: opacity 160ms ease, transform 160ms ease, color 160ms ease;
  user-select: none;

  &:hover {
    opacity: 1;
    color: rgba(15, 23, 42, 0.72);
    transform: translateY(-1px);
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

export const LobbyCardWrap = styled.section`
  ${cardSurface};
  padding: 28px;
  border-radius: 32px;

  h2 {
    margin: 0 0 16px;
    font-size: clamp(2rem, 5vw, 2.5rem);
    line-height: 1.05;
  }

  @media (max-width: 720px) {
    padding: 20px;
    border-radius: 24px;

    h2 {
      font-size: clamp(1.85rem, 8vw, 2.2rem);
      line-height: 1.08;
      margin-bottom: 12px;
    }
  }

  @media (max-width: 420px) {
    padding: 18px;
    border-radius: 22px;

    h2 {
      font-size: 1.75rem;
    }
  }
`;

export const Eyebrow = styled.p`
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--muted);
  font-size: 0.78rem;

  @media (max-width: 720px) {
    margin-bottom: 10px;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
  }
`;

export const Stack = styled.div`
  display: grid;
  gap: 16px;

  @media (max-width: 720px) {
    gap: 12px;
  }
`;

export const FormStack = styled.form`
  display: grid;
  gap: 16px;

  @media (max-width: 720px) {
    gap: 12px;
  }
`;

export const Field = styled.label`
  display: grid;
  gap: 8px;
  color: var(--muted);

  @media (max-width: 720px) {
    gap: 6px;
  }
`;

export const Row = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 720px) {
    flex-direction: column;
    gap: 10px;
  }
`;

export const TextInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  font: inherit;

  @media (max-width: 720px) {
    padding: 12px 15px;
    border-radius: 16px;
  }
`;

export const RoomInput = styled(TextInput)`
  text-transform: uppercase;
  letter-spacing: 0.18em;
`;

export const PrimaryButton = styled.button`
  ${buttonBase};
  width: 100%;
  background: linear-gradient(135deg, var(--accent-dark), #1d4ed8);
  color: white;
  font-weight: 700;
`;

export const SecondaryButton = styled.button`
  ${buttonBase};
  background: var(--accent-soft);
  color: var(--text);
  font-weight: 700;
`;

export const Status = styled.p`
  min-height: 24px;
  margin: 4px 0 0;
  color: var(--muted);

  @media (max-width: 720px) {
    margin-top: 2px;
    font-size: 0.92rem;
    line-height: 1.45;
  }
`;
