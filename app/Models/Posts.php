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

    // $topFolder = null means "is this user allowed to do the one-time
    // bootstrap upload" (there's no existing folder structure to scope
    // against yet) — true if they hold any can_manage_files role at all,
    // even one scoped to specific folders.
    public function canManageFiles($userId, ?string $topFolder = null): bool
    {
        if ($userId == $this->user_id) {
            return true;
        }

        $manageable = $this->manageableFoldersFor($userId);
        if ($manageable === null) {
            return true;
        }
        if ($topFolder === null) {
            return !empty($manageable);
        }
        return in_array($topFolder, $manageable, true);
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
}
