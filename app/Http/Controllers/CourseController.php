<?php

namespace App\Http\Controllers;

use App\Models\Courses;
use App\Models\Teachers;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CourseController extends Controller
{
    public function add_teacher(Request $request){
        if(Auth::user()->roles->pluck('name')->implode(',') =='admin'){
            $data = $request->except(['_token']);
            if(!Teachers::create($data)){
                return response()->json(['error' => 'Error adding Teacher'], 404);
            }
            else{
                return redirect()->back();
            }
        }
        else{
            return response()->json(['error' => 'You are not allowed to add teachers'], 404);
        }
    }
    public function add_course(Request $request){
        
        if(Auth::user()->roles->pluck('name')->implode(',') =='admin'){
            $data = $request->except(['_token']);
            if($newcourse = Courses::create($data)){
                $folderName = 'Course '.$newcourse->id;
                if(!Storage::makeDirectory($folderName)){
                    redirect()->back()->with('status', 'Creating the folder for your group has failed!'); 
                }
                $settings = [
                    'course' => $newcourse->id,
                    'creator_id'=>$data['teacher_id'],
                    'payment_only'=>isset($data['payment_only']),
                    'chat'=>isset($data['chat']),
                    'meetings'=>isset($data['meetings']),
                    'students_database'=>isset($data['students_database']),
                    'link'=>$data['link']
                ];
                $settingsJson = json_encode($settings);
                if(!Storage::put($folderName . '/settings.json', $settingsJson)){
                    redirect()->back()->with('status', 'Creating settings for this course has failed!');
                }
                return redirect()->back();
            }
            else{
                return response()->json(['error' => 'Error adding Course'], 404);
            }
        }
        else{
            return response()->json(['error' => 'You are not allowed to add teachers'], 404);
        }
    }
    public function get_teachers(){
        $teachers = Teachers::get();
        return response()->json($teachers);
    }
    public function get_not_teachers()
    {
        $users = User::leftJoin('teachers', 'users.id', '=', 'teachers.user_id')->whereNull('teachers.user_id')->select('users.id', 'users.name')->get();

        return response()->json($users);
    }
}
