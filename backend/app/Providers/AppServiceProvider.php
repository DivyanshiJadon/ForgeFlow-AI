<?php

namespace App\Providers;

use App\Repositories\Board\BoardRepository;
use App\Repositories\Board\BoardRepositoryInterface;
use App\Repositories\BoardList\BoardListRepository;
use App\Repositories\BoardList\BoardListRepositoryInterface;
use App\Repositories\Card\CardRepository;
use App\Repositories\Card\CardRepositoryInterface;
use App\Services\AI\Providers\GeminiProvider;
use App\Services\AI\Providers\GroqProvider;
use App\Services\AI\Providers\HermesProvider;
use Illuminate\Support\ServiceProvider;

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

        $this->registerAIProviders();
    }

    /**
     * Bind each HTTP AI provider with its config slice injected. Reading
     * settings from config() (not env()) keeps the copilot working under a
     * cached config, and constructor injection keeps providers testable.
     */
    protected function registerAIProviders(): void
    {
        $retries = (int) config('ai.retries', 2);
        $retryDelay = (int) config('ai.retry_delay_ms', 400);

        $bindings = [
            GroqProvider::class => 'ai.providers.groq',
            GeminiProvider::class => 'ai.providers.gemini',
            HermesProvider::class => 'ai.providers.hermes',
        ];

        foreach ($bindings as $class => $configKey) {
            $this->app->singleton($class, fn () => new $class(
                (array) config($configKey, []),
                $retries,
                $retryDelay,
            ));
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
