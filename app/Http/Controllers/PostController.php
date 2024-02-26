<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\PostCodes;
use App\Models\PostMedias;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class PostController extends Controller
{   
    public function get_posts_from_user(Request $request, $user_id)
    {
        $data = Posts::where('user_id', $user_id)->get();
        if (!$data) {
            return response()->json(['error' => 'Error finding posts'], 404); 
        }
        return response()->json($data);
    }
    public function create_post(Request $request)
    {
        $request->validate([
            'code'=>'required',
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
