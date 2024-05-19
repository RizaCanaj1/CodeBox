<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\GroupChat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class GroupController extends Controller
{
    public function get_group_chat($group_id){
        $chat = GroupChat::where('group_id',$group_id)->get();
        if (!$chat) {
            return response()->json(['error' => 'Group Chat not found'], 404); 
        }
        return response()->json($chat);
    }
    public function send_group_message(Request $request,$group_id){
        $chat = GroupChat::where('group_id',$group_id)->get();
        $new_message = [
            'group_id'=>$group_id,
            'from_user_id'=>auth()->id(),
            'content'=>$request['content']
        ];
        if (!GroupChat::create($new_message)) {
            return response()->json(['message' => 'Error creating message'], 404);
        }
        return response()->json($chat);
    }
}
 