import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.css";
// import Header from "@/components/Header"; // Removed Header import
import Sidebar from "@/components/Sidebar"; // Adjust path if necessary
import Providers from "@/components/Providers"; // Import the new provider
import Breadcrumb from "@/components/Breadcrumb";

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
        <Providers>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="flex-1 flex flex-col ml-64 overflow-hidden">
              {/* <Header /> Removed Header rendering */}
              
              {/* Main content */}
              <main className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto">
                  <Breadcrumb />
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
