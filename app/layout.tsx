import "./globals.css";
import { Sidebar } from "../components/Layout/Sidebar";
import { Toaster } from "../components/ui/Toast";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={`${inter.className} bg-slate-50 text-slate-900`}>
                <div className="flex h-screen overflow-hidden">
                    <Sidebar />
                    <main className="flex-1 overflow-y-auto ml-64 p-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                    <Toaster />
                </div>
            </body>
        </html>
    );
}
