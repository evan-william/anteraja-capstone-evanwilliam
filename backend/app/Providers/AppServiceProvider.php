<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach (['Log','Http','Config','Supabase','Auth','Tracking','ShipmentStatus','Finance','Views','Tickets','TicketProof','Imports','RoadRoute','Assistant'] as $file) {
            require_once app_path('Domain/'.$file.'.php');
        }
    }
}
