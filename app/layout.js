import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollObserver from "@/components/ScrollObserver";

export const metadata = {
  title: "Bibliosage",
  description: "Becoming wise through books.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fraunces and Lexend live in /public/fonts and are declared in
            globals.css. Kicking off their download before the stylesheet
            is parsed keeps the first paint from waiting on them. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/fraunces-latin.woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/lexend-latin.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ScrollObserver />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
