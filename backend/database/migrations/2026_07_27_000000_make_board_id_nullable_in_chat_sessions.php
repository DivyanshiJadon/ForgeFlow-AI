<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN, so we rebuild the table
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE ai_chat_sessions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_id INTEGER NULL,
                user_id INTEGER NULL,
                title VARCHAR(255) DEFAULT \'New Chat\',
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL,
                FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ');

        DB::statement('
            INSERT INTO ai_chat_sessions_new (id, board_id, user_id, title, created_at, updated_at)
            SELECT id, board_id, user_id, title, created_at, updated_at
            FROM ai_chat_sessions
        ');

        DB::statement('DROP TABLE ai_chat_sessions');
        DB::statement('ALTER TABLE ai_chat_sessions_new RENAME TO ai_chat_sessions');

        DB::statement('CREATE INDEX idx_ai_chat_sessions_board_id ON ai_chat_sessions (board_id)');
        DB::statement('CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions (user_id)');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        // Revert: make board_id NOT NULL again (would fail if any null board_ids exist)
    }
};
