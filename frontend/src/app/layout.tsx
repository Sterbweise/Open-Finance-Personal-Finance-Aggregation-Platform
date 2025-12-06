import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Open Finance - Personal Finance Dashboard',
    description: 'Aggregate and manage your finances across multiple e-wallets and bank accounts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
