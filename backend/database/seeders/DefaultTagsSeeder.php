<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

class DefaultTagsSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'bug',       'color' => '#ef4444'],
            ['name' => 'feature',   'color' => '#6366f1'],
            ['name' => 'design',    'color' => '#ec4899'],
            ['name' => 'urgent',    'color' => '#f97316'],
            ['name' => 'backend',   'color' => '#10b981'],
            ['name' => 'frontend',  'color' => '#3b82f6'],
            ['name' => 'devops',    'color' => '#8b5cf6'],
            ['name' => 'docs',      'color' => '#64748b'],
        ];

        foreach ($tags as $tag) {
            Tag::firstOrCreate(
                ['name' => $tag['name']],
                ['color' => $tag['color']]
            );
        }
    }
}
