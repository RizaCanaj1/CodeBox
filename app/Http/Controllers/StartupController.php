<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserMedia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class StartupController extends Controller
{
    public function upload_user(Request $request) {
        try {
            $user_id = Auth::id();
            $user = User::find($user_id);
            if ($user) {
                $user->bio = $request->bio;
                if(isset($request->profile_image)) {
                    $base64Image = $request->profile_image;
                    $image = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $base64Image));
                    $randomStr = Str::random(30);
                    $extension = 'png';
                    $path = 'storage/profile-photos/' . $randomStr . '.' . $extension;
                    if (!File::exists('profile-photos')) {
                        File::makeDirectory('profile-photos');
                    }
                    if (File::put(public_path($path), $image)) {
                        $path = 'profile-photos/' . $randomStr . '.' . $extension;
                        $user->profile_photo_path = $path;
                    } else {
                        return response()->json(['message' => 'Failed to save profile image'], 500);
                    }
                    
                }
                if (count($request->social_media) > 0) {
                    foreach ($request->social_media as $media) {
                        $social_data = [
                            'user_id' => $user_id,
                            'social_media' => $media['social_name'],
                            'media_link' => $media['social_link']
                        ];
                        if (!UserMedia::create($social_data)) {
                            return response()->json(['message' => 'Media failed to link'], 404);
                        }
                    }
                }
                $user->assignRole('programmer');
                $user->save();
            } else {
                return response()->json(['error' => 'User not found'], 404);
            }
        } catch (\Exception $e) {
                dd($e);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }
}
