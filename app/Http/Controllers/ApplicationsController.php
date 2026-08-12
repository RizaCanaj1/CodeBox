<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\Notifications;
use App\Models\PostInvitations;

class ApplicationsController extends Controller
{
    public function get_applications($id)
    {
        $post = Posts::findOrFail($id);
        $my_application = PostInvitations::where('post_id', $id)
            ->where('from_user_id', auth()->id())
            ->latest()
            ->first();
        return view('applications', ['post' => $post, 'my_application' => $my_application]);
    }

    public function apply($id)
    {
        $post = Posts::findOrFail($id);
        $auth_id = auth()->id();

        if ($auth_id == $post->user_id) {
            session()->flash('pop_up', 'You can not apply on your own invitation');
            return redirect('dashboard');
        }

        // Guard against duplicate applications — without this, re-submitting
        // the apply form (or the request being replayed) created another
        // 'pending' row every time instead of being a no-op.
        $already_applied = PostInvitations::where('post_id', $id)
            ->where('from_user_id', $auth_id)
            ->exists();
        if ($already_applied) {
            session()->flash('pop_up', 'You have already applied to this invitation');
            return redirect()->back();
        }

        $data = [
            'post_id' => $post->id,
            'from_user_id' => $auth_id,
            'receiver_user_id' => $post->user_id,
            'status' => 'pending',
        ];
        $notification = [
            'user_id' => $post->user_id,
            'from_user_id' => $auth_id,
            'post_id' => $post->id,
            'title' => $post->title . ' | Applicant',
            'content' => User::find($auth_id)->name . ' applied to your invitation.',
        ];

        if (!PostInvitations::create($data)) {
            session()->flash('pop_up', 'Failed to apply. Status 500');
            return redirect('dashboard');
        }
        if (!Notifications::create($notification)) {
            session()->flash('pop_up', 'Failed to create notification. Status 500');
            return redirect('dashboard');
        }

        session()->flash('pop_up', 'You applied on: ' . $post->title);
        return redirect()->back();
    }

    public function handle_applications(Request $request, $id)
    {
        $post = Posts::findOrFail($id);

        if ($post->user_id !== auth()->id()) {
            session()->flash('message', 'Unauthorized');
            return redirect()->back();
        }

        $auth_id = auth()->id();
        $status = null;

        if ($request->has('approve')) {
            $status = 'approved';
        } elseif ($request->has('refuse')) {
            $status = 'refused';
        } else {
            return redirect()->back();
        }

        if (!$request->has('check')) {
            session()->flash('message', 'Select applicants before ' . ($status === 'approved' ? 'approval' : 'refusing'));
            return redirect()->back();
        }

        foreach ($request->input('check') as $applicant) {
            $notification = [
                'user_id' => $applicant,
                'from_user_id' => $auth_id,
                'post_id' => $post->id,
                'title' => $post->title . ' | Status',
                'content' => $status === 'approved'
                    ? 'Your application has been approved'
                    : 'Your application has been refused.',
            ];

            // Scoped to this post — previously this updated every
            // application the user ever made (missing post_id filter),
            // so approving them here could silently approve/refuse their
            // pending applications on unrelated posts too.
            PostInvitations::where('post_id', $post->id)
                ->where('from_user_id', $applicant)
                ->update(['status' => $status]);

            if (!Notifications::create($notification)) {
                session()->flash('pop_up', 'Failed to create notification. Status 500');
            }
        }

        session()->flash('message', 'Applicant successfully ' . ($status === 'approved' ? 'approved' : 'refused'));
        return redirect()->back();
    }
}
