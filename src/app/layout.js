import './globals.css';

export const metadata = {
  title: '⚽ AA FC 예약 시스템',
  description: 'AA FC 풋살 클럽 실시간 예약 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
