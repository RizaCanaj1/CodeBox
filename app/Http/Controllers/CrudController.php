<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\PostCodes;
use App\Models\PostViews;
use App\Models\UserMedia;
use App\Models\PostComments;
use Illuminate\Http\Request;
use App\Models\Notifications;
use App\Models\PostInvitations;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;


class CrudController extends Controller
{   
    public function show_group($groupId){
        $check_user = PostInvitations::where('from_user_id', auth()->id())->where('post_id', $groupId)->where('status', 'approved')->get()->count();
        $check_creator = Posts::where('id','=', $groupId)->where('user_id', auth()->id())->get()->count();
        if($check_user == 0 && $check_creator == 0) return redirect()->route('applications', ['id' => $groupId]);
        
        return view('groups', compact('groupId'));
    }
    public function get_auth (){
        return response()->json(auth()->id());
    }
    public function count_view($id){
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $data = [
            'post_id' => $id,
            'user_id' => auth()->id(),
        ];
        
        $existingView = PostViews::where('post_id', $id)
            ->where('user_id', auth()->id())
            ->count();
        if ($existingView>0) {
            return response()->json(['error' => 'User has already viewed this post']);
        }

        if (!PostViews::create($data)) {
            return response()->json(['error' => 'View not counted']);
        }

        return response()->json(['success' => 'View counted'], 200);
    }
    public function get_role (){
        $role = Auth::user()->roles->pluck('name')->implode(',');
        return response()->json($role);
    }
    public function get_all_users(){
        $users = User::all(['id', 'name']);
        return response()->json($users);
    }
    public function get_posts(){
        $posts = Posts::orderByRaw('RAND()')->join('users', 'users.id', '=', 'posts.user_id')->select('posts.*', 'users.name as username', 'users.profile_photo_path as profile')->paginate(10);
        foreach ($posts as $post) {
            
            $post->auth_id = auth()->id();
            if($post->type == 'community'){
                $media = $post->media()->pluck('source')->toArray();
                $post->media = $media ;
            }
            else if($post->type == 'showcase'){
                $code = $post->code()->pluck('source')->toArray();
                $post->code = $code ;
            }
            else if($post->type == 'invitation'){
                $invitation = PostInvitations::where('from_user_id', auth()->id())->where('post_id', $post->id)->get('status');
                $applied = $invitation->count();
                $post->applied = $applied;
                if($applied == 1){
                    $post->invitation_status = $invitation[0]->status;
                }
                else if($applied > 1){
                    $post->invitation_status = $invitation[count($invitation) - 1]->status;
                }
            }
            if($post->type !='invitation'){
                $postViews = PostViews::where('post_id', $post->id);
                $details = [];
                $views = $postViews->get();
                foreach($views as $viewer){
                    $user = User::select('id', 'name as username', 'profile_photo_path as profile')->find($viewer->user_id);
                    if ($user) {
                        array_push($details,$user);
                    }
                }
                $post->views_count = $postViews->count() ;
                $post->views_details = $details;
            }
            $comments = PostComments::where('post_id', $post->id)->get();
            foreach($comments as $comment){
                $comment->user_detail = User::select('id', 'name as username', 'profile_photo_path as profile')->find($comment->user_id);
            }
            $post->comments = $comments;
        }
        return response()->json($posts);
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
        $post = Posts::where('id', $post_id)->get();
        $user_id = Auth::id();
        $comment = new PostComments();
        $comment->user_id = $user_id;
        $comment->post_id = $post_id;
        $comment->content = $request->input('content');
        $shortenedText ='';
        if (strlen($comment->content ) > 15) {
            $shortenedText = substr($comment->content , 0, 15) . "...";
        } else {
            $shortenedText = $comment->content ;
        }
        $notification = [
            'user_id'=>$post[0]['user_id'],
            'from_user_id'=>$user_id,
            'post_id'=>$post_id,
            'title'=>$post[0]['title'].' | Comment',
            'content'=>User::find($user_id)['name'].' commented : "'.$shortenedText.'"',
        ];
        if(!Notifications::create($notification)){
            return response()->json(['error' => 'Failed to create notification'], 500);
        }
        if (!$comment->save()) {
            return response()->json(['error' => 'Failed to add comment'], 500);
        }
        return response()->json(['message' => 'Comment added successfully']);

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
        $data = User::select('id', 'name as username', 'profile_photo_path as profile', 'email','bio')->find($user_id);
        if (!$data) {
            return response()->json(['error' => 'User not found'], 404); 
        }
        $social_media = UserMedia::where('user_id', $user_id)->get();
        $data->social_media = $social_media;
        return response()->json($data);
    }
    public function get_group($id){
        DB::statement("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        $data['users'] = PostInvitations::with('user')->where('post_id', '=', $id)->where('status', '=', 'approved')->groupBy('from_user_id')->orderByDesc('from_user_id')->get();
        $settingsFilePath = 'Group ' . $id . '/settings.json';
        if (Storage::exists($settingsFilePath)) {
            $settingsJson = Storage::get($settingsFilePath);
            $settingsData = json_decode($settingsJson, true);
            
        } else {
            $settingsData =  'Settings for group ' . $id .' not found';
        }
        $data['settings'] = $settingsData ;
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
