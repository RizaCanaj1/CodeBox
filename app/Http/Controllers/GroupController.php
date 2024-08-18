<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Posts;
use App\Models\GroupChat;
use App\Models\GroupRoles;
use Illuminate\Http\Request;
use App\Models\GroupPermissions;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use App\Models\GroupRoleHasPermission;
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
    public function add_group_role(Request $request,$id){
        $check_user = Posts::where('id',$id)->where('user_id',auth()->id())->get()->count();
        if($check_user == 1){
            $role = [
                'group_id'=>$id,
                'name'=>$request->name,
                'from_user_id'=>auth()->id()
            ];
            if($newRole = GroupRoles::create($role)){
                foreach($request->permissions as $permission){
                    if($permission==true){
                        $permission_id = GroupPermissions::where('permission',$permission)->get();
                        $permission=[
                            'roles_id'=>$newRole->id,
                            'permission_id'=>$permission_id->id,
                        ];
                        if(!GroupRoleHasPermission::create($permission)){
                            return response()->json(['message' => 'Error adding permission'], 500);
                        }
                    }
                }
            }
            else{
                return response()->json(['message' => 'Error creating the role'], 500);
            }
            
            return response()->json($request->all());
        }
        return response()->json(['message' => 'You are not allowed to change the profile'], 404);

    }
}
 