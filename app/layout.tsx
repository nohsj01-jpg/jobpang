import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '잡팡 (JOBPANG) | 오늘 일, 지금 잡자!',
  description: '갑작스러운 결근으로 생긴 인력 공백을 같은 브랜드 경력 근무자와 빠르게 연결하는 긴급 대타 매칭 플랫폼',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full antialiased font-sans">
      <body className="min-h-full bg-zinc-100 text-zinc-900 font-sans flex justify-center selection:bg-blue-100 selection:text-blue-900">
        <div className="w-full max-w-md min-h-screen bg-white flex flex-col relative shadow-md border-x border-zinc-200">
          {children}
        </div>
      </body>
    </html>
  );
}
