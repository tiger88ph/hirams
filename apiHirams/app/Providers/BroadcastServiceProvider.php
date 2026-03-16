<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Use 'api' middleware since your app uses Sanctum API auth
        Broadcast::routes(['middleware' => ['api']]);

        require base_path('routes/channels.php');
    }
}