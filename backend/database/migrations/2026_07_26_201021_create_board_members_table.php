<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('member_id')
                  ->constrained('members')
                  ->cascadeOnDelete();
            $table->string('role')->default('member');
            $table->timestamps();

            $table->unique(['board_id', 'member_id']);
            $table->index('board_id');
            $table->index('member_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_members');
    }
};
