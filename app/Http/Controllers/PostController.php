<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\PostCodes;
use App\Models\PostMedias;
use App\Models\PostComments;
use Illuminate\Http\Request;
use App\Models\PostInvitations;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{   
    public function get_posts_from_user(Request $request, $user_id)
    {
        $posts = Posts::where('user_id', $user_id)->get();
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
            $comments = PostComments::where('post_id', $post->id)->get();
            $post->comments = $comments;
        }
        if (!$posts) {
            return response()->json(['error' => 'Error finding posts'], 404); 
        }
        return response()->json($posts);
    }
    public function create_post(Request $request)
    {
        $request->validate([
            //'code'=>'required',
            'type' => 'required|string',
            'title' => 'required|string',
            'content' => 'required|string'
        ]);
        $data = $request->except(['_token', 'code']);
        $data['user_id'] = auth()->user()->id;
        //return view('create_post', ['data' => $data]);
        if($newPost = Posts::create($data)){
            if($request->hasFile('code') && $data['type']=='showcase'){
                $destinationPath = 'public/codes/';
                foreach($request->code as $codes){
                    $file = $codes->getClientOriginalName();
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    $code = $filename .' - ' .time() .'.'.$ext;
                    Storage::putFileAs($destinationPath, $codes, $code);
                    $codedata=[
                        'post_id'=>$newPost->id,
                        'source'=>$code
                    ];
                    if(!PostCodes::create($codedata)){
                        return redirect()->back()->with('status', 'Your code file did not upload! Check requirments for uploading your codes');
                    }
                }
            }
            if($request->hasFile('media') && $data['type']=='community'){
                $destinationPath = 'public/media/';
                foreach($request->media as $medias){
                    $file = $medias->getClientOriginalName();
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    $media = $filename .' - ' .time() .'.'.$ext;
                    Storage::putFileAs($destinationPath, $medias, $media);
                    $mediadata=[
                        'post_id'=>$newPost->id,
                        'source'=>$media
                    ];
                    if(PostMedias::create($mediadata)){}
                    else{
                        return redirect()->back()->with('status', 'Your media file did not upload! Check requirments for uploading your medias');
                    }
                }
            }
            if($data['type']=='invitation'){
                $folderName = 'Group '.$newPost->id;
                if(!Storage::makeDirectory($folderName)){
                    redirect()->back()->with('status', 'Creating the folder for your group has failed!'); 
                }
                $settings = [
                    'group_id' => $newPost->id,
                    'creator_id'=>$data['user_id']
                ];
                $settingsJson = json_encode($settings);
                if(!Storage::put($folderName . '/settings.json', $settingsJson)){
                    redirect()->back()->with('status', 'Creating settings for your group has failed!');
                }
            }
            return redirect()->route('dashboard')->with('status', 'Post is added');
        }
        return redirect()->back()->with('status', 'Something went wrong!');
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
