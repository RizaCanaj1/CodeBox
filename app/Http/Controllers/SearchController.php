<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\Courses;
use App\Models\Teachers;
use App\Models\PostViews;
use App\Models\PostComments;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\User;

class SearchController extends Controller
{
    public function searchEngine($text){
        $searchedPostsTitle =  Posts::where('title','Like',"%".$text."%")->get();
        $searchedPostsContent =  Posts::where('content','Like',"%".$text."%")->get();
        $searchedPosts = $searchedPostsTitle->merge($searchedPostsContent)->unique('id');
        $searchedUsers =  User::where('name','Like',"%".$text."%")->get(['id', 'name', 'profile_photo_path','bio']);
        $searchedTeachers =  Teachers::where('name','Like',"%".$text."%")->get(['id', 'name', 'profile_photo_path','bio']);
        $searchedCourses = Courses::where('name','Like',"%".$text."%")->get(['id', 'name', 'profile_photo_path','description']);
        $searchedComments = PostComments::where('content','Like',"%".$text."%")->get(['id', 'post_id', 'user_id','content']);
        foreach($searchedPosts as $sPost){
            $sPost->nr_of_comments = PostComments::where('post_id', $sPost->id)->get()->count();
            $sPost->nr_of_views = PostViews::where('post_id', $sPost->id)->get()->count();
        }
        $searchedData = [
            "Posts"=>$searchedPosts,
            "Users"=>$searchedUsers,
            "Courses"=>$searchedCourses,
            "Teachers"=>$searchedTeachers,
            "Comments"=>$searchedComments,
        ];
        return response()->json($searchedData, 200);
    }
}
