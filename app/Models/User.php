<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Posts;
use App\Models\BugHunterProgress;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Jetstream\HasProfilePhoto;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasRoles;
    use HasApiTokens;
    use HasFactory;
    use HasProfilePhoto;
    use Notifiable;
    use TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_photo_url',
    ];
    protected static function boot()
    {
        parent::boot();

        static::created(function ($user) {
            //$user->assignRole('programmer');
        });
    }
    public function posts() {
        return $this->hasMany(Posts::class, 'user_id');
    }

    // Computed on the fly from existing data (post count, join date, account
    // rank) rather than a persisted table — nothing to seed/keep in sync,
    // and every badge is always derived from current, real state. Returns
    // at most one post-count tier (the highest reached), always exactly one
    // join-year badge, and an OG badge only for early accounts.
    public function badges(): array
    {
        $badges = [];

        $postCount = $this->posts()->count();
        $tiers = [
            ['min' => 50, 'key' => 'coder_maniac', 'name' => 'Coder Maniac', 'icon' => 'fa-solid fa-fire', 'color' => '#e6483f'],
            ['min' => 30, 'key' => 'code_slinger', 'name' => 'Code Slinger', 'icon' => 'fa-solid fa-bolt', 'color' => '#a259e6'],
            ['min' => 15, 'key' => 'contributor', 'name' => 'Contributor', 'icon' => 'fa-solid fa-star', 'color' => '#1a7fd6'],
            ['min' => 5, 'key' => 'apprentice_coder', 'name' => 'Apprentice Coder', 'icon' => 'fa-solid fa-seedling', 'color' => '#4caf3c'],
            ['min' => 0, 'key' => 'newcomer', 'name' => 'Newcomer', 'icon' => 'fa-solid fa-egg', 'color' => '#94a3b8'],
        ];
        foreach ($tiers as $tier) {
            if ($postCount >= $tier['min']) {
                $badges[] = [
                    'key' => $tier['key'],
                    'name' => $tier['name'],
                    'description' => $postCount . ' post' . ($postCount === 1 ? '' : 's') . ' published',
                    'icon' => $tier['icon'],
                    'color' => $tier['color'],
                ];
                break;
            }
        }

        $joinYear = $this->created_at->year;
        $badges[] = [
            'key' => 'joined_' . $joinYear,
            'name' => 'Joined ' . $joinYear,
            'description' => 'Member since ' . $joinYear,
            'icon' => 'fa-solid fa-calendar-check',
            'color' => '#64748b',
        ];

        // Ranked by created_at (not raw id) so it stays correct regardless
        // of any gaps from deleted/test accounts.
        $rank = self::where('created_at', '<', $this->created_at)->count() + 1;
        if ($rank <= 100) {
            $badges[] = [
                'key' => 'og',
                'name' => 'OG',
                'description' => 'One of the first 100 members (#' . $rank . ')',
                'icon' => 'fa-solid fa-crown',
                'color' => '#d4af37',
            ];
        }

        // Kept in sync by hand with BugHunterController::LANGUAGES/DIFFICULTIES
        // (7 languages x 3 difficulties = 21 combos). Milestones stack (unlike
        // the post-count badge above, which only shows the single highest
        // tier) — same "collect them all" style as the join-year/OG badges.
        $bugHunterCleared = BugHunterProgress::where('user_id', $this->id)->count();
        $bugHunterMilestones = [
            ['min' => 1, 'key' => 'bug_hunter_started', 'name' => 'Found Some Bugs', 'icon' => 'fa-solid fa-bug', 'color' => '#00a578'],
            ['min' => 3, 'key' => 'bug_hunter_sniffer', 'name' => 'Bug Sniffer', 'icon' => 'fa-solid fa-magnifying-glass', 'color' => '#1a7fd6'],
            ['min' => 7, 'key' => 'bug_hunter_exterminator', 'name' => 'Exterminator', 'icon' => 'fa-solid fa-bomb', 'color' => '#a259e6'],
            ['min' => 15, 'key' => 'bug_hunter_debug_master', 'name' => 'Debug Master', 'icon' => 'fa-solid fa-user-ninja', 'color' => '#e6483f'],
            ['min' => 21, 'key' => 'bug_hunter_finisher', 'name' => 'Bug Finisher', 'icon' => 'fa-solid fa-trophy', 'color' => '#d4af37'],
        ];
        foreach ($bugHunterMilestones as $milestone) {
            if ($bugHunterCleared >= $milestone['min']) {
                $badges[] = [
                    'key' => $milestone['key'],
                    'name' => $milestone['name'],
                    'description' => $milestone['min'] === 21
                        ? 'Cleared every language and difficulty in Bug Hunter'
                        : "Cleared {$milestone['min']}+ Bug Hunter combos",
                    'icon' => $milestone['icon'],
                    'color' => $milestone['color'],
                ];
            }
        }

        return $badges;
    }
}
