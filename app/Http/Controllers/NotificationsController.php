<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notifications;

class NotificationsController extends Controller
{
    public function read_notification($id){
        Notifications::where('id', '=', $id)
        ->update([
        'status' => 'read',
        ]);
        return response()->json(['message' => 'Successful']);
    }
    public function get_notifications($user_id = null){
        if (is_null($user_id)) {
            $user_id = auth()->id();
        }
        $data = [
            'notifications'=> Notifications::where('user_id','=',$user_id)->orderBy('id', 'DESC')->get(),
            'delivered' => Notifications::where('user_id','=',$user_id)->where('status','=','delivered')->count()
        ];
        return response()->json($data);
    }
}
