<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Board;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DefaultUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'admin@forgeflow.dev'],
            [
                'name' => 'Admin',
                'password' => 'password123',
                'api_token' => Str::random(64),
            ]
        );

        Board::whereNull('user_id')->update(['user_id' => $user->id]);

        $this->command?->info("Default user: admin@forgeflow.dev | Token: {$user->api_token}");
    }
}
