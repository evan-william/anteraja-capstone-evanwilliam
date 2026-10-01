<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Courier extends Model {
    protected $fillable = ['name','rating'];
    protected function casts(): array { return ['rating'=>'decimal:2']; }
    public function shipments(): HasMany { return $this->hasMany(Shipment::class); }
}
