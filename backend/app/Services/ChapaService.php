<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ChapaService
{
    public function initialize(array $data): array
    {
        $response = Http::acceptJson()
            ->asJson()
            ->withToken(trim((string) config('services.chapa.secret_key')))
            ->post($this->url('/transaction/initialize'), $data)
            ->throw()
            ->json();

        if (isset($response['data']['checkout_url'])) {
            $response['data']['checkout_url'] = trim(
                (string) $response['data']['checkout_url']
            );
        }

        return $response;
    }

    public function verify(string $txRef): array
    {
        return Http::acceptJson()
            ->withToken(trim((string) config('services.chapa.secret_key')))
            ->get($this->url('/transaction/verify/'.rawurlencode($txRef)))
            ->throw()
            ->json();
    }

    private function url(string $path): string
    {
        return rtrim(trim((string) config('services.chapa.base_url')), '/').$path;
    }
}
