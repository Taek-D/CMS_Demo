import type { Metadata } from 'next';
import { Geist_Mono, Nanum_Myeongjo, Noto_Sans_KR } from 'next/font/google';

import './globals.css';

const bodyFont = Noto_Sans_KR({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const headingFont = Nanum_Myeongjo({
  variable: '--font-heading-serif',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
});

const monoFont = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '네스트 레저 | CMS 자동이체 데모',
  description:
    '어린이집 정기 결제, 자동이체 동의, 미납 관리 흐름을 포트폴리오 수준으로 재현한 멤버·관리자 데모입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
