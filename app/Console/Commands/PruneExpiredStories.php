<?php

namespace App\Console\Commands;

use App\Models\Story;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

// Deletes stories that expired more than a day ago and were never saved as
// a highlight, plus their media file. The stories bar already hides
// expired stories via Story::scopeActive() regardless of whether this ever
// runs — this just stops old rows/files from piling up forever. Scheduled
// daily in app/Console/Kernel.php; needs the Laravel scheduler actually
// running (e.g. `php artisan schedule:work`, or a system cron calling
// `php artisan schedule:run` every minute) to fire on its own.
class PruneExpiredStories extends Command
{
    protected $signature = 'stories:prune';

    protected $description = 'Delete expired, non-highlighted stories and their media files';

    public function handle(): void
    {
        $expired = Story::where('is_highlight', false)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expired as $story) {
            Storage::delete('public/stories/' . $story->source);
            $story->delete();
        }

        $this->info("Pruned {$expired->count()} expired stories.");
    }
}
