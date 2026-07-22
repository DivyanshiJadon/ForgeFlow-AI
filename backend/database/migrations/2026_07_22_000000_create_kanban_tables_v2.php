<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add missing columns to 'boards' table
        Schema::table('boards', function (Blueprint $table) {
            if (!Schema::hasColumn('boards', 'name')) {
                $table->string('name')->nullable();
            }
            if (!Schema::hasColumn('boards', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('boards', 'color')) {
                $table->string('color')->nullable();
            }
            if (!Schema::hasColumn('boards', 'icon')) {
                $table->string('icon')->nullable();
            }
        });

        // 2. Create 'board_lists' table (the columns in Kanban)
        Schema::create('board_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->string('name');
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->index('board_id');
        });

        // 3. Create 'members' table (assignees)
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('avatar_color')->default('#4F46E5');
            $table->timestamps();
        });

        // 4. Create 'tags' table (labels)
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('color');
            $table->timestamps();
        });

        // 5. Create 'cards' table (the tasks inside lists)
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_list_id')
                  ->constrained('board_lists')
                  ->cascadeOnDelete();
            $table->foreignId('member_id')
                  ->nullable()
                  ->constrained('members')
                  ->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('priority')->default('medium'); // low, medium, high
            $table->dateTime('due_date')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();

            $table->index('board_list_id');
            $table->index('member_id');
        });

        // 6. Create pivot table 'card_tag' for labels mapping
        Schema::create('card_tag', function (Blueprint $table) {
            $table->foreignId('card_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('tag_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->primary(['card_id', 'tag_id']);
        });

        // 7. Create 'comments' table for task discussions
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->string('author_name')->default('System');
            $table->text('content');
            $table->timestamps();

            $table->index('card_id');
        });

        // 8. Create 'activity_logs' table for board history
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->string('user_name');
            $table->string('action');
            $table->text('details')->nullable();
            $table->timestamps();

            $table->index('board_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('card_tag');
        Schema::dropIfExists('cards');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('members');
        Schema::dropIfExists('board_lists');

        Schema::table('boards', function (Blueprint $table) {
            $table->dropColumn(['name', 'description', 'color', 'icon']);
        });
    }
};
