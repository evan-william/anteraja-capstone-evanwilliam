<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Shipment extends Model {
    public const STATUSES = ['pending'=>'Menunggu pickup','in_transit'=>'Dalam perjalanan','delivered'=>'Terkirim'];
    protected $fillable = ['tracking_number','weight_kg','status','courier_id'];
    protected function casts(): array { return ['weight_kg'=>'decimal:3']; }
    public function courier(): BelongsTo { return $this->belongsTo(Courier::class); }
}
