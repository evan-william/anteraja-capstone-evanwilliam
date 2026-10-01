@extends('layout')
@section('title', $shipment->tracking_number)
@section('content')
<p class="eyebrow">Detail kiriman</p><h1>{{ $shipment->tracking_number }}</h1>
<section class="panel"><h2>Informasi pengiriman</h2><dl><dt>Berat</dt><dd>{{ $shipment->weight_kg }} kg</dd><dt>Status</dt><dd>{{ \App\Models\Shipment::STATUSES[$shipment->status] ?? $shipment->status }}</dd><dt>Kurir</dt><dd>{{ $shipment->courier->name }}</dd><dt>Rating kurir</dt><dd>{{ $shipment->courier->rating }}/5</dd></dl><a class="button" href="{{ route('shipments.edit',$shipment) }}">Edit kiriman</a><p><a href="{{ route('shipments.index') }}">Kembali ke daftar</a></p></section>
@endsection
