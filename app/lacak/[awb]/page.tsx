import { PublicHeader } from '@/components/tracking/public-header';
import { TrackingExperience } from '@/components/tracking/tracking-experience';

type PageProps = { params: Promise<{ awb: string }>; searchParams: Promise<{ code?: string }> };

export const metadata = { title: 'Status Kiriman — Anteraja' };

export default async function TrackingDetailPage({ params, searchParams }: PageProps) {
  const [{ awb }, { code = '' }] = await Promise.all([params, searchParams]);
  return <div className="min-h-screen bg-[#f8f7f5]"><PublicHeader /><main className="app-main max-w-[1060px]"><TrackingExperience awb={decodeURIComponent(awb).toUpperCase()} code={code} /></main></div>;
}
