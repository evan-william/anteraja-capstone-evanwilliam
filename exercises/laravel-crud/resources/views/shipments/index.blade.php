@extends('layout')
@section('title', 'Daftar kiriman')
@section('content')
<p class="eyebrow">Operasional</p><div class="summary"><div><h1>Kiriman, tertata.</h1><p class="intro">{{ $shipments->total() }} kiriman dari database. Buka detail untuk melihat kurir dan memperbarui status.</p></div><a class="button" href="{{ route('shipments.create') }}">Tambah kiriman</a></div>
<section class="panel">
@if($shipments->isEmpty())<h2>Belum ada kiriman</h2><p>Tambahkan kiriman pertama atau jalankan database seeder.</p>
@else
<div class="table-wrap"><table><caption>Daftar pengiriman dan kurir yang bertugas</caption><thead><tr><th>Resi</th><th>Berat</th><th>Status</th><th>Kurir</th><th>Aksi</th></tr></thead><tbody>
@foreach($shipments as $shipment)
<tr><td><a href="{{ route('shipments.show',$shipment) }}">{{ $shipment->tracking_number }}</a></td><td>{{ $shipment->weight_kg }} kg</td><td>{{ \App\Models\Shipment::STATUSES[$shipment->status] ?? $shipment->status }}</td><td>{{ $shipment->courier->name }}</td><td><div class="actions"><a href="{{ route('shipments.edit',$shipment) }}">Edit</a><form data-delete method="POST" action="{{ route('shipments.destroy',$shipment) }}">@csrf @method('DELETE')<button class="text-button">Hapus</button></form></div></td></tr>
@endforeach
</tbody></table></div>
<nav aria-label="Halaman daftar kiriman">@if($shipments->previousPageUrl())<a href="{{ $shipments->previousPageUrl() }}">Sebelumnya</a>@endif<span>Halaman {{ $shipments->currentPage() }} / {{ $shipments->lastPage() }}</span>@if($shipments->nextPageUrl())<a href="{{ $shipments->nextPageUrl() }}">Berikutnya</a>@endif</nav>
@endif
</section>
@endsection
