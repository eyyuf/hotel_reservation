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
     *
     * Includes a workaround for containerised deployments (e.g. AletCloud)
     * where `config:cache` may run at Docker‑build time with an incomplete
     * `.env`, and `php artisan serve` strips process‑level env vars from its
     * child PHP server.  When the cached config has empty Chapa values we
     * reload the runtime `.env` and patch the config repository in‑place.
     */
    public function boot(): void
    {
        // Tell artisan serve to pass through these variables to the child process.
        // AletCloud runs via artisan serve, which strips unknown env vars.
        if ($this->app->runningInConsole() && class_exists(\Illuminate\Foundation\Console\ServeCommand::class)) {
            \Illuminate\Foundation\Console\ServeCommand::$passthroughVariables = array_unique(array_merge(
                \Illuminate\Foundation\Console\ServeCommand::$passthroughVariables,
                ['CHAPA_SECRET_KEY', 'CHAPA_BASE_URL', 'CHAPA_MODE', 'FRONTEND_URL', 'FILESYSTEM_DISK', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET', 'CLOUDFLARE_R2_ENDPOINT', 'CLOUDFLARE_R2_URL']
            ));
        }

        $this->ensureChapaConfig();
    }

    /**
     * Guarantee that Chapa config values are populated at runtime,
     * regardless of whether config was cached during a Docker build.
     */
    protected function ensureChapaConfig(): void
    {
        // Fast path – if the secret key is already available, nothing to do.
        if (!empty(config('services.chapa.secret_key'))) {
            return;
        }

        // --- Attempt 1: re‑read from process environment ----------------
        $key = getenv('CHAPA_SECRET_KEY') ?: ($_ENV['CHAPA_SECRET_KEY'] ?? null) ?: ($_SERVER['CHAPA_SECRET_KEY'] ?? null);

        // --- Attempt 2: parse the runtime .env file directly ------------
        if (empty($key)) {
            $envPath = base_path('.env');
            if (is_file($envPath) && is_readable($envPath)) {
                $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
                $envVars = [];
                foreach ($lines as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '#')) {
                        continue;
                    }
                    if (str_contains($line, '=')) {
                        [$name, $value] = explode('=', $line, 2);
                        $envVars[trim($name)] = trim($value, " \t\n\r\0\x0B\"'");
                    }
                }
                $key = $envVars['CHAPA_SECRET_KEY'] ?? null;

                // While we're here, patch the remaining Chapa values too.
                if (!empty($key)) {
                    config([
                        'services.chapa.secret_key'   => $key,
                        'services.chapa.base_url'     => $envVars['CHAPA_BASE_URL']     ?? config('services.chapa.base_url', 'https://api.chapa.co/v1'),
                        'services.chapa.mode'         => $envVars['CHAPA_MODE']         ?? config('services.chapa.mode', 'test'),
                        'services.chapa.frontend_url' => $envVars['FRONTEND_URL']       ?? config('services.chapa.frontend_url', 'https://adar-hotels.vercel.app'),
                    ]);
                    return; // all done
                }
            }
        }

        // --- Attempt 1 succeeded – patch config from process env --------
        if (!empty($key)) {
            config([
                'services.chapa.secret_key'   => $key,
                'services.chapa.base_url'     => getenv('CHAPA_BASE_URL')  ?: config('services.chapa.base_url', 'https://api.chapa.co/v1'),
                'services.chapa.mode'         => getenv('CHAPA_MODE')      ?: config('services.chapa.mode', 'test'),
                'services.chapa.frontend_url' => getenv('FRONTEND_URL')    ?: config('services.chapa.frontend_url', 'https://adar-hotels.vercel.app'),
            ]);
        }
    }
}
