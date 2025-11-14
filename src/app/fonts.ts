import { Inter, Vazirmatn } from 'next/font/google';

export const latin = Inter({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap'
});

export const fa = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-fa',
  display: 'swap'
});
