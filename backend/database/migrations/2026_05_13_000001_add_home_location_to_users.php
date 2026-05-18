<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('home_lat', 10, 7)->nullable()->after('home_size');
            $table->decimal('home_lng', 10, 7)->nullable()->after('home_lat');
            $table->boolean('geofence_inside')->default(false)->after('home_lng');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['home_lat', 'home_lng', 'geofence_inside']);
        });
    }
};
