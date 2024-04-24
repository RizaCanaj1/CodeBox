<?php

namespace App\Http\Controllers;

use App\Models\Friends;
use Illuminate\Http\Request;
use App\Models\Notifications;
use Illuminate\Foundation\Auth\User;

class FriendsController extends Controller
{
    public function add_friend( $user_id)
    {
        $data = [
            'user_id' => $user_id,
            'from_user_id' => auth()->id()
        ];
        $notification = [
            'user_id'=>$user_id,
            'from_user_id'=>auth()->id(),
            'post_id'=>null,
            'title'=>User::find($user_id)['name'].' | Friend Request',
            'content'=>User::find($user_id)['name'].' wants to be your frined.',
        ];
        if(!Notifications::create($notification)){
            return response()->json(['error' => 'Failed to create notification'], 500);
        }
        else if($user_id != auth()->id()){
            $friend = Friends::create($data);

            if (!$friend) {
                return response()->json(['error' => 'Failed to add Friend'], 500);
            }
    
            return response()->json(['success' => 'Friend request added'], 201);
        }
        else{
            return response()->json(['error' => "You can't add yourself as frined!"], 500);
        }
    }
    public function get_status($user_id)
    {
        $data = Friends::where('user_id','=',$user_id)->where('from_user_id','=',auth()->id())->get();

        return response()->json($data);
    }
    public function get_requests()
    {
        $data = Friends::where('user_id','=',auth()->id())->where('status','=','no_respond')->get();
        foreach($data as $friend){
            $friend['user_name']=User::find($friend['from_user_id'])['name'];
            $friend['user_image']=User::find($friend['from_user_id'])['profile_photo_path'];
        }
        return response()->json($data);
    }
}
