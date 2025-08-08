import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TaskProvider } from "@/contexts/TaskContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow - Modern Task Management",
  description: "A modern task management app with Pomodoro timer built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TaskProvider>
            <PomodoroProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
              />
            </PomodoroProvider>
          </TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}