<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\PostInvitations;
use Illuminate\Http\Request;

class ApplicationsController extends Controller
{
    public function get_applications($id)
    {
        $post = Posts::where('id','=',$id)->get();
        return view('applications', ['post'=>$post[0]]);
    }
    public function apply($id)
    {
        $post = Posts::where('id','=',$id)->get();
        $user_post = Posts::where('id','=',$id)->first()->user()->get('id');
        if(auth()->id()==$user_post[0]['id']){
            session()->flash('pop_up','You can not apply on your own invitation');
            return redirect('dashboard');
        }
        $data = [
            'post_id'=>$post[0]['id'],
            'from_user_id'=>auth()->id(),
            'receiver_user_id'=>$user_post[0]['id'],
            'status'=>'pending'
        ];
        if(PostInvitations::create($data)){
            session()->flash('pop_up', 'You applied on: '.$post[0]['title']);
        }
        else{
            session()->flash('pop_up', 'Failed to apply. Status 500');
            return redirect('dashboard');
        }
        return redirect('dashboard');
    }
    public function handle_applications(Request $request){
        $test = 'not approved';
        if ($request->has('approve')) {
            if($request->has('check')){
                foreach($request->input('check') as $applicant){
                    PostInvitations::where('from_user_id', '=', $applicant)
                    ->update([
                        'status' => 'approved',
                    ]);
                }
                session()->flash('message', "Applicant successfuly approved");
                return redirect()->back();
            }
            session()->flash('message', "Select applicants before approval");
            return redirect()->back();
        }
        else if($request->has('refuse')){
            if($request->has('check')){
                foreach($request->input('check') as $applicant){
                    PostInvitations::where('from_user_id', '=', $applicant)
                    ->update([
                        'status' => 'refused',
                    ]);
                }
                session()->flash('message', "Applicant successfuly refused");
                return redirect()->back();
            }
            session()->flash('message', "Select applicants before refusing");
            return redirect()->back();
        }
        return redirect()->back();
    }
}
