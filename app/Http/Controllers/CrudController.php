<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\PostCodes;
use App\Models\PostViews;
use App\Models\UserMedia;
use App\Models\PostComments;
use Illuminate\Http\Request;
use App\Models\Notifications;
use App\Models\GroupRoles;
use App\Models\PostInvitations;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Auth;


class CrudController extends Controller
{   
    public function show_group($groupId){
        $post = Posts::findOrFail($groupId);
        if (!$post->isAccessibleBy(auth()->id())) return redirect()->route('applications', ['id' => $groupId]);

        return view('groups', compact('groupId', 'post'));
    }
    public function get_auth (){
        return response()->json(auth()->id());
    }
    public function count_view($id){
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $data = [
            'post_id' => $id,
            'user_id' => auth()->id(),
        ];
        
        $existingView = PostViews::where('post_id', $id)
            ->where('user_id', auth()->id())
            ->count();
        if ($existingView>0) {
            return response()->json(['error' => 'User has already viewed this post']);
        }

        if (!PostViews::create($data)) {
            return response()->json(['error' => 'View not counted']);
        }

        return response()->json(['success' => 'View counted'], 200);
    }
    public function get_role (){
        $role = Auth::user()->roles->pluck('name')->implode(',');
        return response()->json($role);
    }
    public function get_all_users(){
        $users = User::all(['id', 'name']);
        return response()->json($users);
    }
    public function get_posts(){
        // RAND() alone re-shuffles the whole table on every query execution,
        // so page 1 and page 2 of infinite scroll were each an independent
        // random order — the same post could (and often did) land on both.
        // Seeding it and reusing that seed for every page in the same
        // scroll session keeps the order stable, so paginated windows over
        // it don't overlap.
        // Note: get-posts is dispatched via a manual app(CrudController::class)->get_posts()
        // call in routes/web.php, not a real Laravel route, so there's no
        // auto-injected Request param here — use the request() helper instead.
        $seed = (int) request()->query('seed', random_int(1, 2147483647));
        $posts = Posts::orderByRaw('RAND(?)', [$seed])->join('users', 'users.id', '=', 'posts.user_id')->select('posts.*', 'users.name as username', 'users.profile_photo_path as profile')->paginate(10);
        $this->decoratePosts($posts);
        // Hand the seed back so the frontend can pass it on the next page
        // request instead of letting the server pick a fresh one each time.
        $result = $posts->toArray();
        $result['seed'] = $seed;
        return response()->json($result);
    }

    // Used by both get_posts() (dashboard feed) and get_posts_from_user()
    // (profile page) so a post looks/behaves identically wherever it's
    // rendered — same media/code/invitation-status/views/comments shape
    // createpost() in post.js expects.
    private function decoratePosts($posts){
        foreach ($posts as $post) {
            $post->auth_id = auth()->id();
            if($post->type == 'community'){
                $media = $post->media()->pluck('source')->toArray();
                $post->media = $media ;
            }
            else if($post->type == 'showcase'){
                $code = $post->code()->pluck('source')->toArray();
                $post->code = $code ;
            }
            else if($post->type == 'invitation'){
                $invitation = PostInvitations::where('from_user_id', auth()->id())->where('post_id', $post->id)->get('status');
                $applied = $invitation->count();
                $post->applied = $applied;
                if($applied == 1){
                    $post->invitation_status = $invitation[0]->status;
                }
                else if($applied > 1){
                    $post->invitation_status = $invitation[count($invitation) - 1]->status;
                }
            }
            if($post->type !='invitation'){
                $postViews = PostViews::where('post_id', $post->id);
                $details = [];
                $views = $postViews->get();
                foreach($views as $viewer){
                    $user = User::select('id', 'name as username', 'profile_photo_path as profile')->find($viewer->user_id);
                    if ($user) {
                        array_push($details,$user);
                    }
                }
                $post->views_count = $postViews->count() ;
                $post->views_details = $details;
            }
            $comments = PostComments::where('post_id', $post->id)->get();
            foreach($comments as $comment){
                $comment->user_detail = User::select('id', 'name as username', 'profile_photo_path as profile')->find($comment->user_id);
            }
            $post->comments = $comments;
        }
    }

    // Profile page's post.js fetches this for the .post-selector type tabs
    // and post feed — was routed to a PostController method that no longer
    // existed (BadMethodCallException, 500 on every profile page load), so
    // no posts ever rendered here at all.
    public function get_posts_from_user($id){
        $posts = Posts::where('posts.user_id', $id)
            ->join('users', 'users.id', '=', 'posts.user_id')
            ->select('posts.*', 'users.name as username', 'users.profile_photo_path as profile')
            ->orderByDesc('posts.created_at')
            ->get();
        $this->decoratePosts($posts);
        return response()->json(['data' => $posts]);
    }


    public function post_codes($id){
        $data = PostCodes::where('post_id', $id)->get();
        if (!$data) {
            return response()->json(['error' => 'Code not found'], 404); 
        }
        return response()->json($data);
    }
    public function add_comment(Request $request, $post_id)
    {
        $post = Posts::find($post_id);
        $content = $request->input('content');
        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }
        $check_comments = PostComments::where('post_id', $post_id)->where('content', $content)->count();
        
        if ($check_comments > 0) {
            return response()->json(['message' => 'This comment already exists!'], 400);
        }
        $user_id = Auth::id();
        if (!$user_id) {
            return response()->json(['message' => 'User not authenticated'], 401);
        }
        $comment = new PostComments();
        $comment->user_id = $user_id;
        $comment->post_id = $post_id;
        $comment->content = $content;
        $shortenedText = (strlen($comment->content) > 15) ? substr($comment->content, 0, 15) . "..." : $comment->content;
        $notification = [
            'user_id' => $post->user_id,
            'from_user_id' => $user_id,
            'post_id' => $post_id,
            'title' => $post->title . ' | Comment',
            'content' => User::find($user_id)->name . ' commented: "' . $shortenedText . '"',
        ];
        if (!Notifications::create($notification)) {
            return response()->json(['message' => 'Failed to create notification'], 500);
        }
        if (!$comment->save()) {
            return response()->json(['message' => 'Failed to add comment'], 500);
        }
        return response()->json(['message' => 'Comment added successfully']);

    }
    public function get_comments(Request $request, $post_id)
    {
        $data = PostComments::where('post_id', $post_id)->get();
        foreach($data as $comment_data){
            $comment_data->user_detail = User::select('id', 'name as username', 'profile_photo_path as profile')->find($comment_data['user_id']);
        }
        if (!$data) {
            return response()->json(['error' => 'Comments are not found'], 404); 
        }
        return response()->json($data);
    }
    public function get_user(Request $request, $user_id)
    {
        $data = User::select('id', 'name as username', 'profile_photo_path as profile', 'email', 'bio', 'cv_path', 'created_at')->find($user_id);
        if (!$data) {
            return response()->json(['error' => 'User not found'], 404);
        }
        $social_media = UserMedia::where('user_id', $user_id)->get();
        $data->social_media = $social_media;
        $data->badges = $data->badges();
        return response()->json($data);
    }
    public function get_group($id){
        $post = Posts::findOrFail($id);
        if (!$post->isAccessibleBy(auth()->id())) {
            return response()->json(['message' => 'You are not a member of this group'], 403);
        }

        DB::statement("SET sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
        $data['users'] = PostInvitations::with('user')->where('post_id', '=', $id)->where('status', '=', 'approved')->groupBy('from_user_id')->orderByDesc('from_user_id')->get();
        $data['roles'] = GroupRoles::with('folders', 'members:id,name')->where('group_id', $id)->get();
        $data['manageable_folders'] = $post->manageableFoldersFor(auth()->id());
        $data['downloadable_folders'] = $post->downloadableFoldersFor(auth()->id());
        // creator_id used to come only from Group/{id}/settings.json — but
        // some groups have that file under the old 'Group {id}' (space)
        // path, and some (created before that feature existed at all) never
        // had one. Either way this silently returned a plain error string
        // instead of an object, so every `settings.creator_id` read on the
        // frontend (every creator-only check — "Add Role" included) came
        // back undefined. The post's own user_id is already the reliable
        // source of truth for who created the group, so settings.json is
        // no longer needed for this at all.
        $data['settings'] = [
            'group_id' => $post->id,
            'creator_id' => $post->user_id,
        ];
        return response()->json($data);
        
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
