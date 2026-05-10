import { DM_Sans, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "../devices/device-shell.css";
import "./top5-shell.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function Top5Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} ${inter.variable} devices-route-fonts`}
      style={{ background: "#ffffff", minHeight: "100%" }}
    >
      {children}
    </div>
  );
}
