import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Binara \u2014 Binaural Beats',
    short_name: 'Binara',
    description: 'Binaural beats engineered for your brain. 24 presets, 3 creation modes, phone sensor control.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050810',
    theme_color: '#050810',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['health', 'music', 'lifestyle'],
  };
}
