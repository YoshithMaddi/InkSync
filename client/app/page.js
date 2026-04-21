import LobbyCard from "../components/LobbyCard";
import { LobbyCenter, LobbyShell, SignatureMark } from "../components/lobbyStyles";

export default function HomePage() {
  return (
    <LobbyShell>
      <LobbyCenter>
        <LobbyCard />
      </LobbyCenter>

      <SignatureMark aria-label="Built by Yoshith">
        -- Yoshith23
      </SignatureMark>
    </LobbyShell>
  );
}
