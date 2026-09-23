export const trackingApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Anteraja Tracking & Operations',
  description:
    'Aplikasi web untuk melacak paket, memahami risiko pengiriman, dan mengirim instruksi penanganan kendala.',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Shipment tracking and logistics operations',
  operatingSystem: 'Web',
  browserRequirements: 'Requires HTML5 and JavaScript support',
  inLanguage: 'id-ID',
  isAccessibleForFree: true,
  featureList: [
    'Pelacakan paket dengan nomor resi dan kode akses',
    'Timeline perjalanan paket',
    'Estimasi waktu tiba dan status risiko',
    'Perbaikan alamat, penjadwalan ulang, dan safe drop',
    'Tiket customer service dengan konteks pengiriman',
  ],
} as const;

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
