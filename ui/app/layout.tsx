import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MLPie - MLOps Platform",
  description: "Git-native, plugin-extensible MLOps and GenAI platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col ml-64 overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-card border-b border-border flex items-center px-6 sticky top-0 z-10">
              <div className="flex-1 flex">
                {/* Search bar - can be implemented later */}
                <div className="relative text-gray-400 focus-within:text-gray-600 w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="search"
                    className="py-2 pl-10 pr-3 w-full rounded-md bg-secondary text-sm text-foreground placeholder-muted focus:outline-none"
                    placeholder="Search..."
                  />
                </div>
              </div>
              
              {/* User menu & notifications - can be implemented later */}
              <div className="flex items-center">
                <button 
                  className="p-2 rounded-full hover:bg-accent text-muted"
                  aria-label="View notifications"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </button>
              </div>
            </header>
            
            {/* Main content */}
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
