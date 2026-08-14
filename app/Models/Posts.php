<?php

namespace App\Models;

use App\Models\User;
use App\Models\PostCodes;
use App\Models\PostMedias;
use App\Models\PostInvitations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Posts extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'content',
        'programming_languages',
        'working_hours',
        'payment'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
    public function code(){
        return $this->hasMany(PostCodes::class, 'post_id');
    }
    public function media(){
        return $this->hasMany(PostMedias::class, 'post_id');
    }
    public function comments(){
        return $this->hasMany(PostComments::class, 'post_id');
    }
    public function invitations() {
        return $this->hasMany(PostInvitations::class,'post_id');
    }
    public function roles() {
        return $this->hasMany(GroupRoles::class, 'group_id');
    }

    // Creator, or an approved applicant, can use this post's group workspace.
    public function isAccessibleBy($userId): bool
    {
        if ($userId == $this->user_id) {
            return true;
        }
        return $this->invitations()
            ->where('from_user_id', $userId)
            ->where('status', 'approved')
            ->exists();
    }

    // null = unrestricted (sees every top-level Code/ folder). The creator is
    // always unrestricted. A member with no roles, or with any unrestricted
    // role (one with zero group_role_folders rows), is also unrestricted —
    // folder access only narrows once every one of a member's roles opts in
    // to a restricted list, so groups that never touch roles keep working
    // exactly as before.
    public function allowedFoldersFor($userId): ?array
    {
        if ($userId == $this->user_id) {
            return null;
        }

        $roles = $this->roles()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->with('folders')
            ->get();

        // No roles at all means no restriction was ever configured, so the
        // safe default is "unrestricted" here — matches manageableFoldersFor's
        // opposite default below.
        return $this->resolveFolderAccess($roles, true);
    }

    // Write-side sibling of allowedFoldersFor(), scoped to roles that also
    // carry can_manage_files. Unlike view access, the safe default for a
    // write permission is closed, not open — a member with zero
    // can_manage_files roles can manage nothing, rather than everything.
    public function manageableFoldersFor($userId): ?array
    {
        if ($userId == $this->user_id) {
            return null;
        }

        $roles = $this->roles()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->where('can_manage_files', true)
            ->with('folders')
            ->get();

        return $this->resolveFolderAccess($roles, false);
    }

    // $path = null means "is this user allowed to do the one-time
    // bootstrap upload" (there's no existing folder structure to scope
    // against yet) — true if they hold any can_manage_files role at all,
    // even one scoped to specific folders. Otherwise $path is checked via
    // pathCoveredByAny() so a role restricted to "Alpha" also covers
    // "Alpha/Sub/file.txt", not just an exact top-level match.
    public function canManageFiles($userId, ?string $path = null): bool
    {
        if ($userId == $this->user_id) {
            return true;
        }

        $manageable = $this->manageableFoldersFor($userId);
        if ($manageable === null) {
            return true;
        }
        if ($path === null) {
            return !empty($manageable);
        }
        return self::pathCoveredByAny($path, $manageable);
    }

    // Download-side sibling of manageableFoldersFor() — same closed-by-default
    // semantics (a member with zero can_download roles can download
    // nothing), just filtered to roles that carry can_download instead of
    // can_manage_files. Kept as its own permission rather than folded into
    // canManageFiles() since a member might reasonably be allowed to
    // export a folder's contents without being allowed to edit/delete
    // inside it, or vice versa.
    public function downloadableFoldersFor($userId): ?array
    {
        if ($userId == $this->user_id) {
            return null;
        }

        $roles = $this->roles()
            ->whereHas('members', fn ($q) => $q->where('users.id', $userId))
            ->where('can_download', true)
            ->with('folders')
            ->get();

        return $this->resolveFolderAccess($roles, false);
    }

    public function canDownloadFiles($userId, ?string $path = null): bool
    {
        if ($userId == $this->user_id) {
            return true;
        }

        $downloadable = $this->downloadableFoldersFor($userId);
        if ($downloadable === null) {
            return true;
        }
        if ($path === null) {
            return !empty($downloadable);
        }
        return self::pathCoveredByAny($path, $downloadable);
    }

    // Shared by allowedFoldersFor()/manageableFoldersFor(): null = every
    // folder; [] = none; array = exactly those folder names. A member is
    // only ever narrowed to a specific list once EVERY one of their
    // (filtered) roles opts into a restricted folder list — any unrestricted
    // role in the mix makes the whole result unrestricted, same as a single
    // unrestricted role does on its own.
    private function resolveFolderAccess($roles, bool $emptyMeansUnrestricted): ?array
    {
        if ($roles->isEmpty()) {
            return $emptyMeansUnrestricted ? null : [];
        }

        $restrictedRoles = $roles->filter(fn ($role) => $role->folders->isNotEmpty());
        if ($restrictedRoles->count() < $roles->count()) {
            return null;
        }

        return $restrictedRoles
            ->flatMap(fn ($role) => $role->folders->pluck('folder_name'))
            ->unique()
            ->values()
            ->all();
    }

    // True if $path is granted by one of the $allowed entries — either an
    // exact match, or a descendant of one (an entry of "Alpha" covers
    // "Alpha/Sub" and "Alpha/Sub/file.txt"). Used for permission ACTIONS
    // (write/download a specific file or folder): restricting a role to a
    // folder implicitly grants it every file/subfolder inside that folder,
    // but never a broader ancestor.
    public static function pathCoveredByAny(string $path, array $allowed): bool
    {
        foreach ($allowed as $entry) {
            if ($path === $entry || str_starts_with($path, $entry . '/')) {
                return true;
            }
        }
        return false;
    }

    // True if $path is an ancestor of (or equal to) one of the $allowed
    // entries — e.g. $path="Alpha" and an entry of "Alpha/Sub" both match,
    // since "Alpha" needs to still show up (pruned down to just "Sub")
    // in a listing even though "Alpha" itself isn't directly granted. Used
    // for LISTING (deciding whether a folder is worth recursing into),
    // never for actions — being an ancestor of a granted path doesn't grant
    // write/download rights to the ancestor itself.
    public static function pathHasAllowedDescendant(string $path, array $allowed): bool
    {
        foreach ($allowed as $entry) {
            if ($path === $entry || str_starts_with($entry, $path . '/')) {
                return true;
            }
        }
        return false;
    }
}
