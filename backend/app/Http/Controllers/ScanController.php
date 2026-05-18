<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ScanController extends Controller
{
    /**
     * GET /api/scan/devices
     *
     * Returns simulated nearby device discovery results.
     * (Real mDNS scanning is a Node.js-specific feature; in production this
     * can be replaced with network probing via sockets or a queued job.)
     */
    public function scan(Request $request)
    {
        // Simulate a realistic scan with a brief delay
        usleep(500000); // 0.5s artificial delay to mimic network scan

        $discovered = [
            [
                'id'       => 'mdns-hue-' . substr(md5(uniqid()), 0, 8),
                'name'     => 'Philips Hue Bridge',
                'type'     => 'light',
                'protocol' => 'wifi',
            ],
            [
                'id'       => 'mdns-cast-' . substr(md5(uniqid()), 0, 8),
                'name'     => 'Chromecast Ultra',
                'type'     => 'tv',
                'protocol' => 'wifi',
            ],
            [
                'id'       => 'mdns-nest-' . substr(md5(uniqid()), 0, 8),
                'name'     => 'Nest Thermostat',
                'type'     => 'thermostat',
                'protocol' => 'wifi',
            ],
            [
                'id'       => 'mdns-ring-' . substr(md5(uniqid()), 0, 8),
                'name'     => 'Ring Doorbell Pro',
                'type'     => 'camera',
                'protocol' => 'wifi',
            ],
            [
                'id'       => 'mdns-lock-' . substr(md5(uniqid()), 0, 8),
                'name'     => 'August Smart Lock',
                'type'     => 'lock',
                'protocol' => 'bluetooth',
            ],
        ];

        // Randomly return a subset to feel authentic
        shuffle($discovered);
        $count = rand(2, count($discovered));
        return response()->json(array_slice($discovered, 0, $count));
    }
}
