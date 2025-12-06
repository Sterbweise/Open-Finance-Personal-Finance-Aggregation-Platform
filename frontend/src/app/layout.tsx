import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MyDuit - Personal Finance Dashboard',
    description: 'Aggregate your e-wallets and bank accounts in one beautiful dashboard',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AppLayout>{children}</AppLayout>
            </body>
        </html>
    );
}
