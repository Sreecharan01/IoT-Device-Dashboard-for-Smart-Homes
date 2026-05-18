<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    // ── Haversine distance in km ─────────────────────────────────────────────
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2
              + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    // ── GET /api/home-location ───────────────────────────────────────────────
    public function getHome(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'home_lat'        => $user->home_lat,
            'home_lng'        => $user->home_lng,
            'geofence_inside' => (bool) $user->geofence_inside,
        ]);
    }

    // ── POST /api/home-location ──────────────────────────────────────────────
    public function setHome(Request $request)
    {
        $data = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $request->user()->update([
            'home_lat' => $data['lat'],
            'home_lng' => $data['lng'],
        ]);

        return response()->json(['message' => 'Home location saved.', 'lat' => $data['lat'], 'lng' => $data['lng']]);
    }

    // ── POST /api/location ───────────────────────────────────────────────────
    // Called every ~5 s by the mobile tracker page
    public function update(Request $request)
    {
        $data = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $user = $request->user();

        // No home set yet — just acknowledge
        if (is_null($user->home_lat) || is_null($user->home_lng)) {
            return response()->json(['status' => 'no_home', 'distance' => null]);
        }

        $distance  = $this->haversine($data['lat'], $data['lng'], (float) $user->home_lat, (float) $user->home_lng);
        $inRange   = $distance <= 1.5;
        $wasInside = (bool) $user->geofence_inside;

        $triggered = [];

        // ── Just entered the 1.5 km zone ────────────────────────────────────
        if ($inRange && !$wasInside) {
            $devices = Device::where('user_id', $user->id)
                ->where('geofence_enabled', true)
                ->where('status', 'online')
                ->get();

            foreach ($devices as $device) {
                $state = $device->state ?? [];
                if (in_array($device->type, ['light', 'ac', 'thermostat'])) {
                    $state['isOn'] = true;
                } elseif ($device->type === 'lock') {
                    $state['isLocked'] = false;
                }
                $device->state = $state;
                $device->save();
                $triggered[] = $device->name;
            }

            $user->update(['geofence_inside' => true]);
        }

        // ── Just left the 1.5 km zone ────────────────────────────────────────
        if (!$inRange && $wasInside) {
            $devices = Device::where('user_id', $user->id)
                ->where('geofence_enabled', true)
                ->where('status', 'online')
                ->get();

            foreach ($devices as $device) {
                $state = $device->state ?? [];
                if (in_array($device->type, ['light', 'ac', 'thermostat'])) {
                    $state['isOn'] = false;
                } elseif ($device->type === 'lock') {
                    $state['isLocked'] = true;
                }
                $device->state = $state;
                $device->save();
                $triggered[] = $device->name;
            }

            $user->update(['geofence_inside' => false]);
        }

        return response()->json([
            'status'    => $inRange ? 'inside' : 'outside',
            'distance'  => round($distance, 3),
            'triggered' => $triggered,
            'in_range'  => $inRange,
        ]);
    }
}
