"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: 40, height: 40 }} />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        flexShrink: 0,
        border: "1px solid var(--input-border)",
        background: "var(--input-bg)",
        color: "var(--foreground)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
      title={`Cambiar a modo ${isDark ? "claro" : "oscuro"}`}
      aria-label="Alternar modo oscuro"
    >
      {isDark ? (
        <Moon size={20} className="text-gradient" />
      ) : (
        <Sun size={20} color="var(--primary)" />
      )}
    </button>
  );
}
