import './globals.css';

export const metadata = {
  title: 'سما | سیستم مدیریت اداری',
  description: 'سیستم مدیریت اداری سازمان — سما',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
