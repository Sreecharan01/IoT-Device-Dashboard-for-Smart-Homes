<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_uid')->unique(); // the 'd1', 'd2' style id from frontend
            $table->string('name');
            $table->string('type'); // light, thermostat, lock, ac, tv, camera, etc.
            $table->string('location');
            $table->string('status')->default('online'); // online, offline
            $table->json('state'); // flexible state object: {isOn, brightness, temp, etc.}
            $table->string('connection')->default('wifi'); // wifi, satellite, bluetooth
            $table->boolean('geofence_enabled')->default(false);
            $table->boolean('satellite_support')->default(false);
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
