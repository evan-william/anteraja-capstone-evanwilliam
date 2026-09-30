<?php
declare(strict_types=1);

/** Turns operational shipment fields into customer-facing timing information. */
final class ShipmentStatus
{
    public static function describe(array $shipment, ?DateTimeImmutable $now = null): array
    {
        $delivery = (string) ($shipment['delivery_status'] ?? '');
        if ($delivery === 'delivered') {
            return ['code' => 'delivered', 'label' => 'Sudah diterima', 'message' => 'Paket sudah sampai di tujuan.'];
        }
        if (in_array($delivery, ['returned', 'cancelled'], true)) {
            return ['code' => 'closed', 'label' => 'Pengiriman selesai', 'message' => 'Pengiriman ini tidak lagi dalam perjalanan.'];
        }

        $risk = (string) ($shipment['risk_status'] ?? '');
        if ($risk === 'action_required') {
            return ['code' => 'action_required', 'label' => 'Perlu tindakan', 'message' => self::issueMessage($shipment)];
        }
        if ($risk === 'resolved') {
            return ['code' => 'resolved', 'label' => 'Instruksi diterima', 'message' => 'Instruksi sudah diterima. Estimasi akan diperbarui setelah kurir menyinkronkan perjalanan.'];
        }

        $rawEta = $shipment['estimated_delivery_at'] ?? null;
        if (!is_string($rawEta) || trim($rawEta) === '') {
            return ['code' => 'unknown', 'label' => 'Estimasi diperbarui', 'message' => 'Waktu tiba belum tersedia. Lihat pembaruan perjalanan terakhir.'];
        }
        try {
            $eta = new DateTimeImmutable($rawEta);
        } catch (Exception) {
            return ['code' => 'unknown', 'label' => 'Estimasi diperbarui', 'message' => 'Waktu tiba belum tersedia. Lihat pembaruan perjalanan terakhir.'];
        }
        $now ??= new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
        $seconds = $eta->getTimestamp() - $now->getTimestamp();

        if ($seconds < 0) {
            return ['code' => 'delayed', 'label' => 'Lewat estimasi', 'message' => self::issueMessage($shipment)];
        }
        if ($risk === 'at_risk') {
            return ['code' => 'at_risk', 'label' => 'Berisiko terlambat', 'message' => self::issueMessage($shipment)];
        }
        if ($seconds < 7200) {
            return ['code' => 'approaching', 'label' => 'Mendekati estimasi', 'message' => 'Estimasi tiba kurang dari dua jam lagi. Pantau pembaruan kurir.'];
        }
        return ['code' => 'on_time', 'label' => 'Sesuai estimasi', 'message' => 'Paket masih dalam jadwal pengiriman.'];
    }

    public static function issueMessage(array $shipment): string
    {
        $reason = trim((string) ($shipment['exception_reason'] ?? ''));
        if ($reason !== '') return $reason;

        return match (strtoupper((string) ($shipment['exception_code'] ?? ''))) {
            'CUACA', 'WEATHER' => 'Cuaca menghambat perjalanan. Paket tetap dipantau oleh tim kami.',
            'ALAMAT', 'ADDRESS_ISSUE' => 'Alamat belum cukup jelas. Periksa instruksi penerima di bawah.',
            'HUB_PENUH', 'HUB_CAPACITY' => 'Proses sortir di hub lebih lama dari perkiraan.',
            default => 'Ada kendala pengiriman. Tim kami sedang memeriksanya.',
        };
    }
}
