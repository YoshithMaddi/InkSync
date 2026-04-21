import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "../lib/StyledComponentsRegistry";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

export const metadata = {
  title: "Room Whiteboard",
  description: "Create or join a room and sketch together."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
