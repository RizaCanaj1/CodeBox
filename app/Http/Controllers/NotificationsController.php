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
}
