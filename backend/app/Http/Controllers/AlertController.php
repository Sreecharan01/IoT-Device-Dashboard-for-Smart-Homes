<?php

namespace App\Http\Controllers;

use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * GET /api/alerts
     */
    public function index()
    {
        $alerts = Alert::with('author:id,email')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json($alerts);
    }

    /**
     * POST /api/alerts  (admin only)
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'   => 'required|string',
            'message' => 'required|string',
            'type'    => 'in:info,warning,critical,news',
        ]);

        $alert = Alert::create([
            'title'     => $request->title,
            'message'   => $request->message,
            'type'      => $request->type ?? 'news',
            'author_id' => $request->user()->id,
        ]);

        return response()->json($alert, 201);
    }
}
