import type {Metadata} from "next";
import "./globals.css";
import { FixedViewport } from "@/components/FixedViewport";

export const metadata: Metadata = {
    title: "c12d — Bitcoin Core Analytics",
    description: "Open-source real-time monitoring dashboard for Bitcoin Core P2P network — peers, mempool, orphanage, and debug logs.",
    keywords: "Bitcoin, Bitcoin Core, P2P, peer-observer, mempool, orphanage, network analysis, dashboard",
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={"h-full w-full"}>
        <body className={`antialiased w-full h-full`}>
            <FixedViewport>
                {children}
            </FixedViewport>
        </body>
        </html>
    );
}
