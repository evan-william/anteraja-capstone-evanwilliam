<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('couriers', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->decimal('rating',3,2); $table->timestamps();
        });
        Schema::create('shipments', function (Blueprint $table) {
            $table->id(); $table->string('tracking_number',80)->unique(); $table->decimal('weight_kg',10,3);
            $table->string('status',30); $table->foreignId('courier_id')->constrained()->restrictOnDelete(); $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('shipments'); Schema::dropIfExists('couriers'); }
};
