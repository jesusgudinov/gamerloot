import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import FetchInterceptor from "@/components/FetchInterceptor";
import { GoogleOAuthProvider } from '@react-oauth/google';

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gamer Loot | Admin Panel",
  description: "La tienda premium de equipo de cómputo y componentes de México.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${manrope.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <FetchInterceptor />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <GoogleOAuthProvider clientId="649272582040-ht9unbfa1u6gkgtb7v199d41c2o2lc5v.apps.googleusercontent.com">
                {children}
              </GoogleOAuthProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
