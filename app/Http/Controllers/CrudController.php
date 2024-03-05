<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\PostCodes;
use App\Models\PostComments;
use Illuminate\Http\Request;
use App\Models\PostInvitations;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Auth;


class CrudController extends Controller
{   
    public function show_group($groupId){
        $check_user = PostInvitations::where('from_user_id', auth()->id())->where('post_id', $groupId)->where('status', 'approved')->get()->count();
        $check_creator = Posts::where('id','=', $groupId)->where('user_id', auth()->id())->get()->count();
        if($check_user == 0 && $check_creator == 0) return redirect()->route('applications', ['id' => $groupId]);
        
        return view('groups', compact('groupId'));
    }
    public function get_all_users()
    {
        return view('users', ['users' => User::all()]);
    }
    public function post_codes($id){
        $data = PostCodes::where('post_id', $id)->get();
        if (!$data) {
            return response()->json(['error' => 'Code not found'], 404); 
        }
        return response()->json($data);
    }
    public function add_comment(Request $request, $post_id)
    {
        $user_id = Auth::id();
        $comment = new PostComments();
        $comment->user_id = $user_id;
        $comment->post_id = $post_id;
        $comment->content = $request->input('content');
        if (!$comment->save()) {
            return response()->json(['error' => 'Failed to add comment'], 500);
        }
    
        return response()->json(['message' => 'Comment added successfully']);

        // Return a response (e.g., success message, updated data)
    }
    public function get_comments(Request $request, $post_id)
    {
        $data = PostComments::where('post_id', $post_id)->get();
        if (!$data) {
            return response()->json(['error' => 'Comments are not found'], 404); 
        }
        return response()->json($data);
    }
    public function get_user(Request $request, $user_id)
    {
        $data = User::find($user_id);
        if (!$data) {
            return response()->json(['error' => 'User not found'], 404); 
        }
        return response()->json($data);
    }
    public function get_group_users($id){
        DB::statement("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        $data = PostInvitations::with('user')->where('post_id', '=', $id)->where('status', '=', 'approved')->groupBy('from_user_id')->orderByDesc('from_user_id')->get();
        return response()->json($data);
    }
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        if($user->delete()) {
            return redirect()->back();
        }

        return redirect()->back();
    }
    
}
