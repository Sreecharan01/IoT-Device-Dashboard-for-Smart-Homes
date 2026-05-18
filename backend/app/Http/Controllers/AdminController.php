<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * GET /api/admin/users
     */
    public function users()
    {
        $users = User::select('id', 'email', 'role', 'subscription', 'electricity_price', 'home_size', 'currency', 'created_at')
            ->get()
            ->map(fn($u) => [
                '_id'              => $u->id,
                'email'            => $u->email,
                'role'             => $u->role,
                'subscription'     => $u->subscription,
                'electricityPrice' => $u->electricity_price,
                'homeSize'         => $u->home_size,
                'currency'         => $u->currency,
                'createdAt'        => $u->created_at,
            ]);

        return response()->json($users);
    }

    /**
     * GET /api/admin/devices
     */
    public function devices()
    {
        $devices = Device::with('user:id,email')->get()
            ->map(fn($d) => [
                '_id'              => $d->id,
                'id'               => $d->device_uid,
                'name'             => $d->name,
                'type'             => $d->type,
                'location'         => $d->location,
                'status'           => $d->status,
                'state'            => $d->state,
                'connection'       => $d->connection,
                'geofenceEnabled'  => $d->geofence_enabled,
                'satelliteSupport' => $d->satellite_support,
                'userId'           => ['_id' => $d->user?->id, 'email' => $d->user?->email],
            ]);

        return response()->json($devices);
    }

    /**
     * PUT /api/admin/users/{id}/subscription
     */
    public function updateSubscription(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->subscription = $request->subscription ?? $user->subscription;
        $user->save();

        return response()->json(['message' => 'Subscription updated', 'subscription' => $user->subscription]);
    }
}
