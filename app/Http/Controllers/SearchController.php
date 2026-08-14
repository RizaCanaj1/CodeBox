<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\Courses;
use App\Models\Teachers;
use App\Models\User;
use App\Models\PostViews;
use App\Models\PostComments;

class SearchController extends Controller
{
    // Escapes LIKE's own wildcard chars so a literal "%" or "_" typed by
    // the user searches for that literal character instead of acting as
    // a wildcard (e.g. a bare "%" would otherwise match every row).
    private function likeTerm(string $text): string
    {
        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $text);
        return '%' . $escaped . '%';
    }

    public function searchEngine($text)
    {
        // Anything shorter than this is too broad to be a useful search
        // and would otherwise fire a full-table LIKE scan on every
        // keystroke — empty result set instead of querying at all.
        if (mb_strlen(trim($text)) < 2) {
            return response()->json([
                'Posts' => [],
                'Users' => [],
                'Courses' => [],
                'Teachers' => [],
                'Comments' => [],
            ], 200);
        }

        $term = $this->likeTerm($text);

        $searchedPostsTitle = Posts::where('title', 'Like', $term)->get();
        $searchedPostsContent = Posts::where('content', 'Like', $term)->get();
        $searchedPosts = $searchedPostsTitle->merge($searchedPostsContent)->unique('id');

        $searchedUsers = User::where('name', 'Like', $term)->get(['id', 'name', 'profile_photo_path', 'bio']);
        $searchedTeachers = Teachers::where('name', 'Like', $term)->orWhere('bio', 'Like', $term)->get(['id', 'name', 'profile_photo_path', 'bio']);
        $searchedCourses = Courses::where('name', 'Like', $term)
            ->orWhere('description', 'Like', $term)
            ->with('teacher:id,name')
            ->get(['id', 'teacher_id', 'name', 'description', 'price', 'profile_photo_path']);
        $searchedComments = PostComments::where('content', 'Like', $term)->get(['id', 'post_id', 'user_id', 'content']);

        foreach ($searchedPosts as $sPost) {
            $sPost->nr_of_comments = PostComments::where('post_id', $sPost->id)->count();
            $sPost->nr_of_views = PostViews::where('post_id', $sPost->id)->count();
        }

        $searchedData = [
            "Posts" => $searchedPosts,
            "Users" => $searchedUsers,
            "Courses" => $searchedCourses,
            "Teachers" => $searchedTeachers,
            "Comments" => $searchedComments,
        ];
        return response()->json($searchedData, 200);
    }
}
