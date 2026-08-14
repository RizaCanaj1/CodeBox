<?php

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BugHunterController;
use App\Http\Controllers\CrudController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\FriendsController;
use App\Http\Controllers\StartupController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ApplicationsController;
use App\Http\Controllers\NotificationsController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});
Route::post('/dashboard',[PostController::class, 'create_post'])->name('create_post');
Route::get('/logout', 'Auth\LoginController@logout')->name('logout');
Route::get('/authid',[CrudController::class,'get_auth']);
Route::get('/course', function () { return view('course');});
// Deliberately OUTSIDE the auth:sanctum group below — this endpoint
// self-authorizes via a signed token (see PostController::makePreviewToken)
// rather than the session cookie, because the beta-test preview loads
// content into a sandboxed cross-origin iframe whose own subresource
// requests (its <link>/<script src> tags) don't carry cookies. If this
// route sat behind the auth middleware, those requests would 302 to
// /login instead of reaching the token check at all.
Route::get('/preview-project-asset/{token}/{path}', [PostController::class,'preview_project_asset'])->where('path', '.*');
Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified'
])->group(function () {
    // Was registered outside this middleware group (and the actual file
    // fetch bypassed Laravel entirely, hitting the storage symlink
    // directly) — this page previewed uploaded HTML with no auth check at
    // all. Registered here, before the '/{path}' catch-all below, so it
    // doesn't get swallowed by that wildcard.
    Route::get('/beta-test', function () { return view('beta-test'); })->name('beta_test');
    Route::get('/{path}',function ($path) {
        if (auth()->user()->hasAnyRole(Role::all())) {
            if($path=='dashboard'){return view('dashboard');}
            if($path=='startup'){return redirect()->to('../dashboard');}
            if($path=='puzzle'){return view('puzzle');}
            if($path=='profile'){return view('profile');}
            if($path=='friends'){return view('friends');}
            
            //Crud
            //User
            if($path=='get-all-users'){return app(CrudController::class)->get_all_users();}
            if($path=='get-requests'){return app(FriendsController::class)->get_requests();}
            if($path=='get-friends'){return app(FriendsController::class)->get_friends();}
            if($path=='get-suggestions'){return app(FriendsController::class)->get_suggestions();}
            if($path=='get_role'){return app(CrudController::class)->get_role();}
            //Post
            if($path=='get-posts'){return app(CrudController::class)->get_posts();}
            //Stories
            if($path=='get-stories'){return app(StoryController::class)->get_stories();}
            //Chat
            if($path=='get-conversations'){return app(ChatController::class)->conversations();}
            //Course
            if($path=='get_teachers'){return app(CourseController::class)->get_teachers();}
            if($path=='get-not-teachers'){return app(CourseController::class)->get_not_teachers();}
            if($path=='get_courses'){return app(CourseController::class)->get_courses();}
        }
        else{
            if($path=='startup'){return view('startup');}
            return redirect()->to('../startup');
        }
    })->name('path_corrector');
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');
    // Two path segments, so it never collides with the single-segment
    // '/{path}' catch-all above (which is what still serves '/puzzle'
    // itself) — no extra ordering care needed because of that.
    Route::get('/puzzle/bug-hunter', function () {
        return view('bug_hunter');
    })->name('bug_hunter');
    Route::get('/bug-hunter/progress', [BugHunterController::class, 'progress']);
    Route::post('/bug-hunter/complete', [BugHunterController::class, 'complete']);
    Route::get('/bug-hunter/my-courses', [BugHunterController::class, 'myCourses']);
    Route::post('/bug-hunter/submit-challenge', [BugHunterController::class, 'submitChallenge']);
    Route::get('/bug-hunter/submissions', [BugHunterController::class, 'submissions']);
    Route::get('/bug-hunter/puzzle/{id}', [BugHunterController::class, 'puzzle']);
    Route::post('/bug-hunter/report/{id}', [BugHunterController::class, 'report']);
    //Views
    //Route::get('/puzzle', function () { return view('puzzle');});
    //Route::get('/invitation', function () { return view('invitation_posts');});
    //Route::get('/showcase', function () { return view('showcase_posts');});
    //Route::get('/question', function () { return view('question_posts');});
    //Route::get('/community', function () { return view('community_posts');});
    //Route::get('/profile', function () { return view('profile');});
    //Route::get('/friends', function () { return view('friends');});
    Route::get('/group/{id}',[CrudController::class,'show_group'])->name('group');
    Route::get('/group_chat/{id}',[GroupController::class,'get_group_chat'])->name('group_chat');
    Route::post('/send_group_message/{id}',[GroupController::class,'send_group_message'])->name('send_group_message');
    Route::post('/add-group-role/{id}',[GroupController::class,'add_group_role'])->name('add_group_role');
    Route::put('/group/{groupId}/roles/{roleId}',[GroupController::class,'update_group_role'])->name('update_group_role');
    Route::delete('/group/{groupId}/roles/{roleId}',[GroupController::class,'delete_group_role'])->name('delete_group_role');
    Route::post('/group/{groupId}/members/{userId}/roles',[GroupController::class,'set_member_roles'])->name('set_member_roles');
    Route::get('/group/{groupId}/folder-roles',[GroupController::class,'get_folder_roles'])->name('get_folder_roles');
    Route::post('/group/{groupId}/folder-roles',[GroupController::class,'set_folder_roles'])->name('set_folder_roles');
    Route::get('/group/{groupId}/todos',[GroupController::class,'get_group_todos'])->name('group_todos');
    Route::post('/group/{groupId}/todos',[GroupController::class,'store_group_todo'])->name('store_group_todo');
    Route::put('/group/{groupId}/todos/{todoId}',[GroupController::class,'update_group_todo'])->name('update_group_todo');
    Route::post('/group/{groupId}/todos/{todoId}/toggle',[GroupController::class,'toggle_group_todo'])->name('toggle_group_todo');
    Route::delete('/group/{groupId}/todos/{todoId}',[GroupController::class,'delete_group_todo'])->name('delete_group_todo');
    Route::get('/searched/{text}',[SearchController::class,'searchEngine'])->name('searched');
    //Crud
    //User
    //Route::get('/get-all-users',[CrudController::class,'get_all_users']);
    Route::get('/get-user/{user_id}', [CrudController::class, 'get_user']);
    Route::get('/get_notifications/{user_id?}',[NotificationsController::class,'get_notifications']);
    Route::get('/get-friend-status/{user_id}', [FriendsController::class, 'get_status'])->name('get_friend_status');
    //Route::get('/get-requests', [FriendsController::class, 'get_requests'])->name('get_requests');
    //Route::get('/get_role',[CrudController::class,'get_role']);
    Route::get('/add-friend/{user_id}', [FriendsController::class, 'add_friend'])->name('add_friend');
    Route::post('/accept-friend/{user_id}', [FriendsController::class, 'accept_friend'])->name('accept_friend');
    Route::post('/decline-friend/{user_id}', [FriendsController::class, 'decline_friend'])->name('decline_friend');
    Route::get('/read_notification/{id}', [NotificationsController::class, 'read_notification'])->name('read_notification');
    Route::post('/upload_user', [StartupController::class, 'upload_user']);
    //Post
    //Route::get('/get-posts', [CrudController::class, 'get_posts'])->name('posts');
    Route::get('/get-post-code/{id}', [CrudController::class, 'post_codes'])->name('post_codes');
    Route::get('/preview-post-code/{file_name}', [PostController::class, 'preview_post_code']);
    Route::get('/count-view/{id}',[CrudController::class,'count_view']);
    Route::get('/get-posts-from-user/{id}', [CrudController::class, 'get_posts_from_user'])->name('posts_from_user');
    Route::get('/get-comments/{post_id}', [CrudController::class, 'get_comments']);
    Route::get('/get-group/{id}',[CrudController::class,'get_group'])->name('get_group');
    Route::get('/applications/{id}',  [ApplicationsController::class, 'get_applications'])->name('applications');
    Route::get('/get_project/{id}',[PostController::class,'get_project'])->name('get_project');
    Route::post('/handle_applications/{id}',[ApplicationsController::class, 'handle_applications'])->name('handle_applications');
    Route::get('/get-code/{file_name}',[PostController::class,'get_post_code']);
    Route::post('/applications/{id}',  [ApplicationsController::class, 'apply'])->name('apply');
    Route::post('/add-comment/{post_id}', [CrudController::class, 'add_comment']);
    Route::post('/edit-comment', [PostController::class, 'edit_comment']);
    Route::post('/project_code',[PostController::class,'project_code']);
    Route::post('/get-code',[PostController::class,'get_code']);
    // Throttled — this proxies to a shared public code-execution API
    // (Piston), so an unbounded loop of Run clicks would burn through their
    // rate limit for every user of this app, not just the one clicking.
    Route::post('/run-code', [PostController::class,'run_code'])->middleware('throttle:12,1');
    Route::post('/update-project-file',[PostController::class,'update_project_file']);
    Route::post('/delete-project-file',[PostController::class,'delete_project_file']);
    Route::post('/create-project-folder',[PostController::class,'create_project_folder']);
    Route::post('/add-project-files',[PostController::class,'add_project_files']);
    Route::post('/download-project-files',[PostController::class,'download_project_files']);
    
    //Course
    //Route::get('/get_teachers',[CourseController::class,'get_teachers'])->name('get_teachers');
    //Route::get('/get-not-teachers',[CourseController::class,'get_not_teachers']);
    Route::post('/add_teacher',[CourseController::class,'add_teacher'])->name('add_teacher');
    Route::post('/add_course',[CourseController::class,'add_course'])->name('add_course');
    Route::put('/update_course/{id}',[CourseController::class,'update_course'])->name('update_course');
    Route::delete('/delete_course/{id}',[CourseController::class,'delete_course'])->name('delete_course');

    //Stories
    // GET /get-stories is handled by the /{path} catch-all above instead
    // (same as get-posts, get-all-users, etc.) — a route registered here
    // would never be reached anyway, since that catch-all matches first
    // for any single-segment GET path.
    Route::post('/add-story', [StoryController::class, 'store']);
    Route::post('/view-story/{id}', [StoryController::class, 'view']);
    Route::post('/toggle-story-highlight/{id}', [StoryController::class, 'toggle_highlight']);

    //Chat
    // GET /get-conversations is handled by the /{path} catch-all above
    // (same reasoning as get-stories) — these two have a second URL
    // segment so they don't collide with it.
    Route::get('/get-messages/{friend_id}', [ChatController::class, 'messages']);
    Route::post('/send-message/{friend_id}', [ChatController::class, 'send']);
});
