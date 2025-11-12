import './globals.css';

export const metadata = {
  title: 'Ignite Client Portal',
  description: 'Your engagement hub for proposals and deliverables',
  icons: {
    icon: '/favicon-client.svg',
    shortcut: '/favicon-client.svg',
    apple: '/favicon-client.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

