<?php

namespace App\Http\Controllers;

use App\Models\Story;
use App\Models\StoryView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StoryController extends Controller
{
    // Active stories (see Story::scopeActive), grouped by author: the
    // authenticated user's own group first (so "Add to your story" always
    // sits next to their own ring), then everyone else with unseen stories
    // ahead of fully-seen ones — same ordering Instagram-style story bars use.
    public function get_stories()
    {
        $authId = auth()->id();

        $stories = Story::active()
            ->with('user:id,name,profile_photo_path')
            ->orderBy('created_at')
            ->get();

        $viewedIds = StoryView::where('user_id', $authId)->pluck('story_id')->all();

        $grouped = $stories->groupBy('user_id')->map(function ($userStories) use ($authId, $viewedIds) {
            $first = $userStories->first();
            $isOwn = $first->user_id == $authId;

            return [
                'user_id' => $first->user_id,
                'username' => $first->user->name,
                'profile' => $first->user->profile_photo_path,
                'is_own' => $isOwn,
                'all_viewed' => $userStories->every(fn ($s) => in_array($s->id, $viewedIds)),
                'stories' => $userStories->map(function ($s) use ($viewedIds, $isOwn) {
                    return [
                        'id' => $s->id,
                        'type' => $s->type,
                        'source' => $s->source,
                        'caption' => $s->caption,
                        'is_highlight' => $s->is_highlight,
                        'created_at' => $s->created_at,
                        'expires_at' => $s->expires_at,
                        'viewed' => in_array($s->id, $viewedIds),
                        'views_count' => $isOwn ? $s->views()->count() : null,
                    ];
                })->values(),
            ];
        })->values();

        $own = $grouped->firstWhere('is_own', true);
        $others = $grouped->where('is_own', false)->sortBy('all_viewed')->values();

        return response()->json([
            'own' => $own,
            'others' => $others,
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('create stories')) {
            return response()->json(['error' => 'You are not allowed to post stories'], 403);
        }

        $request->validate([
            'media' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov|max:20480',
            'caption' => 'nullable|string|max:280',
        ]);

        $file = $request->file('media');
        $ext = strtolower($file->getClientOriginalExtension());
        $type = in_array($ext, ['mp4', 'mov']) ? 'video' : 'image';
        $filename = auth()->id() . '-' . time() . '-' . uniqid() . '.' . $ext;

        if (!Storage::putFileAs('public/stories', $file, $filename)) {
            return response()->json(['error' => 'Your story did not upload, please try again'], 500);
        }

        $story = Story::create([
            'user_id' => auth()->id(),
            'type' => $type,
            'source' => $filename,
            'caption' => $request->input('caption'),
            'expires_at' => now()->addDay(),
        ]);

        return response()->json(['success' => true, 'story' => $story]);
    }

    // Records a view (skipped for the story's own author, same as
    // CrudController::count_view() skips nothing but naturally never
    // matters there — here it matters because a story shouldn't count
    // itself as "seen by someone else" when its own author is just
    // re-watching it).
    public function view($id)
    {
        $story = Story::find($id);
        if (!$story) {
            return response()->json(['error' => 'Story not found'], 404);
        }

        if ($story->user_id != auth()->id()) {
            $alreadyViewed = StoryView::where('story_id', $id)->where('user_id', auth()->id())->exists();
            if (!$alreadyViewed) {
                StoryView::create(['story_id' => $id, 'user_id' => auth()->id()]);
            }
        }

        return response()->json(['success' => true]);
    }

    // Flips a story between "expires after a day" and "kept as a
    // highlight" — see Story::scopeActive(). Owner-only.
    public function toggle_highlight($id)
    {
        $story = Story::where('id', $id)->where('user_id', auth()->id())->first();
        if (!$story) {
            return response()->json(['error' => 'Story not found'], 404);
        }

        $story->is_highlight = !$story->is_highlight;
        $story->save();

        return response()->json(['success' => true, 'is_highlight' => $story->is_highlight]);
    }
}
