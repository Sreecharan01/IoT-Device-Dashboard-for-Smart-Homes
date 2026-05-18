<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    /**
     * GET /api/devices
     */
    public function index(Request $request)
    {
        $devices = Device::where('user_id', $request->user()->id)->get();
        return response()->json($this->formatDevices($devices));
    }

    /**
     * POST /api/devices
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string',
            'type'     => 'required|string',
            'location' => 'required|string',
            'status'   => 'required|string',
            'state'    => 'required',
        ]);

        $device = Device::create([
            'device_uid'       => $request->id ?? 'd' . uniqid(),
            'name'             => $request->name,
            'type'             => $request->type,
            'location'         => $request->location,
            'status'           => $request->status,
            'state'            => $request->state,
            'connection'       => $request->connection ?? 'wifi',
            'geofence_enabled' => $request->geofenceEnabled ?? false,
            'satellite_support'=> $request->satelliteSupport ?? false,
            'user_id'          => $request->user()->id,
        ]);

        return response()->json($this->formatDevice($device), 201);
    }

    /**
     * PUT /api/devices/{id}
     */
    public function update(Request $request, $id)
    {
        $device = Device::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$device) {
            // Try by device_uid
            $device = Device::where('device_uid', $id)
                ->where('user_id', $request->user()->id)
                ->first();
        }

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        $device->fill([
            'name'             => $request->name ?? $device->name,
            'type'             => $request->type ?? $device->type,
            'location'         => $request->location ?? $device->location,
            'status'           => $request->status ?? $device->status,
            'state'            => $request->state ?? $device->state,
            'connection'       => $request->connection ?? $device->connection,
            'geofence_enabled' => $request->geofenceEnabled ?? $device->geofence_enabled,
            'satellite_support'=> $request->satelliteSupport ?? $device->satellite_support,
        ]);
        $device->save();

        return response()->json($this->formatDevice($device));
    }

    /**
     * DELETE /api/devices/{id}
     */
    public function destroy(Request $request, $id)
    {
        $device = Device::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$device) {
            $device = Device::where('device_uid', $id)
                ->where('user_id', $request->user()->id)
                ->first();
        }

        if (!$device) {
            return response()->json(['message' => 'Device not found'], 404);
        }

        $device->delete();
        return response()->json(['message' => 'Device removed']);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function formatDevice(Device $device): array
    {
        return [
            '_id'              => $device->id,
            'id'               => $device->device_uid,
            'name'             => $device->name,
            'type'             => $device->type,
            'location'         => $device->location,
            'status'           => $device->status,
            'state'            => $device->state,
            'connection'       => $device->connection,
            'geofenceEnabled'  => $device->geofence_enabled,
            'satelliteSupport' => $device->satellite_support,
        ];
    }

    private function formatDevices($devices): array
    {
        return $devices->map(fn($d) => $this->formatDevice($d))->values()->toArray();
    }
}
