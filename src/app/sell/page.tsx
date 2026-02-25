import type { Metadata } from 'next';
import SellPageClient from './SellPageClient';

export const metadata: Metadata = {
  title: 'Binara — Sales Playbook',
  robots: { index: false, follow: false },
};

export default function SellPage() {
  return <SellPageClient />;
}
