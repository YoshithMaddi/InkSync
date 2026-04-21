import LobbyCard from "../components/LobbyCard";

export default function HomePage() {
  return (
    <main className="lobby-shell">
      <section className="lobby-center">
        <LobbyCard />
      </section>

      <div className="signature-mark" aria-label="Built by Yoshith">
        -- Yoshith
      </div>
    </main>
  );
}
