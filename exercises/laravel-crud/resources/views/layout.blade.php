<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>@yield('title') · Anteraja latihan</title><link rel="stylesheet" href="{{ asset('app.css') }}"></head>
<body><header><a href="{{ route('shipments.index') }}">anteraja <small>pengelolaan kiriman · latihan lokal</small></a><nav><a href="{{ route('shipments.index') }}">Daftar kiriman</a><a href="{{ route('shipments.create') }}">Tambah kiriman</a></nav></header>
<main>
@if(session('success'))<p class="notice" role="status">{{ session('success') }}</p>@endif
@if($errors->any())<section class="notice error" role="alert"><h2>Periksa kembali data</h2><ul>@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></section>@endif
@yield('content')
</main><footer>Laravel · Eloquent · Database relasional lokal. Bukan data pengiriman produksi.</footer>
<script>document.addEventListener('submit', function(event) { if (event.target.matches('[data-delete]') && !confirm('Hapus kiriman ini? Data dihapus permanen.')) event.preventDefault(); });</script>
</body></html>
