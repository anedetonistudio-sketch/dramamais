import { ImageResponse } from "next/og";

export const alt = "Drama+ — Microdramas 100% brasileiros por R$ 25/mês";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80,
        background: "linear-gradient(135deg, #0b0b10 0%, #3a0a1a 60%, #ff2e63 130%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 110, height: 110, borderRadius: 26, background: "#ff2e63", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 54, fontWeight: 800 }}>D+</div>
          <div style={{ fontSize: 64, fontWeight: 800 }}>Drama+</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 58, fontWeight: 800, lineHeight: 1.1 }}>Dramas em português, feitos no Brasil.</div>
        <div style={{ marginTop: 24, fontSize: 34, color: "#ffc94a" }}>R$ 25/mês para assistir tudo — sem moedas, sem pagar por episódio.</div>
      </div>
    ),
    size
  );
}
