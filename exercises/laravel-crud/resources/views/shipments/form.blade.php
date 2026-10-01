@extends('layout')
@section('title', $shipment->exists ? 'Edit kiriman' : 'Tambah kiriman')
@section('content')
<p class="eyebrow">Data pengiriman</p><h1>{{ $shipment->exists ? 'Perbarui kiriman.' : 'Tambahkan kiriman.' }}</h1>
<section class="panel form-panel"><form method="POST" action="{{ $shipment->exists ? route('shipments.update',$shipment) : route('shipments.store') }}">
@csrf
@if($shipment->exists) @method('PUT') @endif
<label for="tracking_number">Nomor resi</label><input id="tracking_number" name="tracking_number" maxlength="80" value="{{ old('tracking_number',$shipment->tracking_number) }}" required aria-describedby="tracking-help"><small id="tracking-help">Harus unik dan maksimal 80 karakter.</small>
<label for="weight_kg">Berat (kg)</label><input type="number" id="weight_kg" name="weight_kg" min="0.001" max="9999999.999" step="0.001" value="{{ old('weight_kg',$shipment->weight_kg) }}" required>
<label for="status">Status pengiriman</label><select id="status" name="status" required>@foreach(\App\Models\Shipment::STATUSES as $value=>$label)<option value="{{ $value }}" @selected(old('status',$shipment->status) === $value)>{{ $label }}</option>@endforeach</select>
<label for="courier_id">Kurir</label><select id="courier_id" name="courier_id" required><option value="">Pilih kurir</option>@foreach($couriers as $courier)<option value="{{ $courier->id }}" @selected((string)old('courier_id',$shipment->courier_id) === (string)$courier->id)>{{ $courier->name }} · rating {{ $courier->rating }}/5</option>@endforeach</select>
<button type="submit">{{ $shipment->exists ? 'Simpan perubahan' : 'Simpan kiriman' }}</button><p><a href="{{ route('shipments.index') }}">Batal dan kembali</a></p>
</form></section>
@endsection
