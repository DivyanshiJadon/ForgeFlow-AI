<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Board\BoardRepositoryInterface;
use App\Repositories\Board\BoardRepository;
use App\Repositories\BoardList\BoardListRepositoryInterface;
use App\Repositories\BoardList\BoardListRepository;
use App\Repositories\Card\CardRepositoryInterface;
use App\Repositories\Card\CardRepository;
use App\Services\Slack\SlackService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(BoardRepositoryInterface::class, BoardRepository::class);
        $this->app->bind(BoardListRepositoryInterface::class, BoardListRepository::class);
        $this->app->bind(CardRepositoryInterface::class, CardRepository::class);
        $this->app->singleton(SlackService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
