<?php

namespace App\Http\Controllers;

use App\Models\Friends;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\Notifications;

class FriendsController extends Controller
{
    public function add_friend($user_id)
    {
        // Self-check now runs before anything is written — previously a
        // notification was created (targeting yourself) even when the
        // request would go on to be rejected for that exact reason.
        if ($user_id == auth()->id()) {
            return response()->json(['error' => "You can't add yourself as friend!"], 422);
        }

        $friend = Friends::create([
            'user_id' => $user_id,
            'from_user_id' => auth()->id(),
        ]);
        if (!$friend) {
            return response()->json(['error' => 'Failed to add Friend'], 500);
        }

        Notifications::create([
            'user_id' => $user_id,
            'from_user_id' => auth()->id(),
            'post_id' => null,
            'title' => auth()->user()->name . ' | Friend Request',
            'content' => auth()->user()->name . ' wants to be your friend.',
        ]);

        return response()->json(['success' => 'Friend request added'], 201);
    }

    public function get_status($user_id)
    {
        $data = Friends::where('user_id', '=', $user_id)->where('from_user_id', '=', auth()->id())->get();
        return response()->json($data);
    }

    public function get_requests()
    {
        $data = Friends::where('user_id', auth()->id())->where('status', 'no_respond')->get();
        foreach ($data as $friend) {
            $requester = User::find($friend->from_user_id);
            $friend->user_name = optional($requester)->name;
            $friend->user_image = optional($requester)->profile_photo_path;
        }
        return response()->json($data);
    }

    // The friends table has no `id` primary key, so Eloquent's own
    // save()/delete() on a fetched instance (both build their WHERE clause
    // from the model's primary key) silently target `WHERE id = null` and
    // never touch the actual row — every write here goes through the query
    // builder directly, keyed on the (user_id, from_user_id) pair instead.
    public function accept_friend($fromUserId)
    {
        $updated = Friends::where('user_id', auth()->id())->where('from_user_id', $fromUserId)->update(['status' => 'accepted']);
        if (!$updated) {
            return response()->json(['message' => 'Friend request not found'], 404);
        }

        Notifications::create([
            'user_id' => $fromUserId,
            'from_user_id' => auth()->id(),
            'post_id' => null,
            'title' => auth()->user()->name . ' | Friend Request Accepted',
            'content' => auth()->user()->name . ' accepted your friend request.',
        ]);

        return response()->json(['message' => 'Friend request accepted']);
    }

    // Deletes the row (rather than marking it 'declined') so the same two
    // people can send a fresh request later instead of being permanently
    // stuck.
    public function decline_friend($fromUserId)
    {
        $deleted = Friends::where('user_id', auth()->id())->where('from_user_id', $fromUserId)->delete();
        if (!$deleted) {
            return response()->json(['message' => 'Friend request not found'], 404);
        }

        return response()->json(['message' => 'Friend request declined']);
    }

    // Accepted friend ids for $userId, in either direction — a friendship
    // is one row, and either side of it (user_id or from_user_id) can be
    // the current user, so both are checked.
    private function acceptedFriendIds($userId)
    {
        return Friends::where('status', 'accepted')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)->orWhere('from_user_id', $userId);
            })
            ->get()
            ->map(fn ($f) => $f->user_id == $userId ? $f->from_user_id : $f->user_id);
    }

    public function get_friends()
    {
        $ids = $this->acceptedFriendIds(auth()->id());
        $users = User::whereIn('id', $ids)->get(['id', 'name', 'profile_photo_path']);
        return response()->json($users->values());
    }

    // "People you may know" — friends of my friends who I'm not already
    // friends with, don't have a pending request with, and aren't myself.
    // Each candidate reports how many of MY friends they're also friends
    // with (and up to 3 of those, for the "3 mutual friends" avatar row),
    // ranked by that count.
    public function get_suggestions()
    {
        $me = auth()->id();
        $myFriendIds = $this->acceptedFriendIds($me);

        $relatedIds = Friends::where(function ($q) use ($me) {
                $q->where('user_id', $me)->orWhere('from_user_id', $me);
            })
            ->get()
            ->flatMap(fn ($f) => [$f->user_id, $f->from_user_id])
            ->push($me)
            ->unique();

        $candidateIds = collect();
        foreach ($myFriendIds as $friendId) {
            $candidateIds = $candidateIds->merge($this->acceptedFriendIds($friendId));
        }
        $candidateIds = $candidateIds->unique()->diff($relatedIds)->values();

        $suggestions = $candidateIds->map(function ($candidateId) use ($myFriendIds) {
            $mutualIds = $myFriendIds->intersect($this->acceptedFriendIds($candidateId))->values();
            $mutualUsers = User::whereIn('id', $mutualIds->take(3))->get(['id', 'name', 'profile_photo_path']);
            $user = User::find($candidateId);
            return [
                'id' => $candidateId,
                'name' => optional($user)->name,
                'profile_photo_path' => optional($user)->profile_photo_path,
                'mutual_count' => $mutualIds->count(),
                'mutual_friends' => $mutualUsers->values(),
            ];
        })
        ->sortByDesc('mutual_count')
        ->take(10)
        ->values();

        return response()->json($suggestions);
    }
}
