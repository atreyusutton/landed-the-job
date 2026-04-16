import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "LandedTheJob — Your resume, rewritten to win.",
  description:
    "AI-powered resume tailoring and cover letter generation for job seekers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-white text-[#1a1a1a]">{children}</body>
      </html>
    </ClerkProvider>
  );
}
