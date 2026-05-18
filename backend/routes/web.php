<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Health check route for Render deployment
Route::get('/up', function () {
    return response('OK', 200);
});
