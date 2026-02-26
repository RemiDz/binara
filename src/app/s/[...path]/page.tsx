import type { Metadata } from 'next';
import { getPresetById } from '@/lib/presets';
import App from '@/components/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSplash from '@/components/LoadingSplash';

interface SharePageProps {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { path } = await params;
  const slug = path[0];

  if (slug === 'mix') {
    return {
      title: 'Binara — Shared Mix Session',
      description: 'Try this custom binaural beat mix session on Binara. Free, no download needed.',
      openGraph: {
        title: 'Binara — Shared Mix Session',
        description: 'Try this custom binaural beat mix session on Binara. Free, no download needed.',
        url: `https://binara.app/s/mix`,
      },
    };
  }

  if (slug === 'create') {
    return {
      title: 'Binara — Custom Sound Session',
      description: 'Try this custom binaural beat session on Binara. Free, no download needed.',
      openGraph: {
        title: 'Binara — Custom Sound Session',
        description: 'Try this custom binaural beat session on Binara. Free, no download needed.',
        url: `https://binara.app/s/create`,
      },
    };
  }

  // Listen preset
  const preset = getPresetById(slug);
  if (preset) {
    return {
      title: `Binara — ${preset.name} (${preset.brainwaveLabel} · ${preset.beatFreq} Hz)`,
      description: `Try this ${preset.brainwaveLabel.toLowerCase()} binaural beat session for ${preset.description.toLowerCase()} Free, no download needed.`,
      openGraph: {
        title: `Binara — ${preset.name} (${preset.brainwaveLabel} · ${preset.beatFreq} Hz)`,
        description: `Try this ${preset.brainwaveLabel.toLowerCase()} binaural beat session on Binara. Free, no download needed.`,
        url: `https://binara.app/s/${slug}`,
      },
    };
  }

  return {
    title: 'Binara — Session Not Found',
    description: 'Explore binaural beats presets on Binara.',
  };
}

export default function SharePage() {
  return (
    <ErrorBoundary>
      <LoadingSplash>
        <App />
      </LoadingSplash>
    </ErrorBoundary>
  );
}
