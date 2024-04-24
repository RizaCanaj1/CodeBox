<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CrudController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\FriendsController;
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

Route::post('/add-comment/{post_id}', [CrudController::class, 'add_comment']);

Route::get('/get-comments/{post_id}', [CrudController::class, 'get_comments']);

Route::get('/get-all-users',[CrudController::class,'get_all_users']);
Route::get('/get-not-teachers',[CourseController::class,'get_not_teachers']);
Route::get('/get-user/{user_id}', [CrudController::class, 'get_user']);
Route::get('/get-posts', [CrudController::class, 'get_posts'])->name('posts');
Route::get('/get-post-code/{id}', [CrudController::class, 'post_codes'])->name('post_codes');
Route::get('/get-group/{id}',[CrudController::class,'get_group'])->name('get_group');
Route::get('/group-settings/{id}',[CrudController::class,'group_settings'])->name('group_settings');
Route::get('/authid',[CrudController::class,'get_auth']);
Route::get('/get_role',[CrudController::class,'get_role']);

Route::get('/get-posts-from-user/{id}', [PostController::class, 'get_posts_from_user'])->name('posts_from_user');
Route::get('/read_notification/{id}', [NotificationsController::class, 'read_notification'])->name('read_notification');
Route::get('/get_notifications/{user_id?}',[NotificationsController::class,'get_notifications']);

Route::get('/applications/{id}',  [ApplicationsController::class, 'get_applications'])->name('applications');
Route::post('/applications/{id}',  [ApplicationsController::class, 'apply'])->name('applications');
Route::get('/handle_applications/{id}',[ApplicationsController::class, 'handle_applications'])->name('handle_applications');

Route::post('/add_teacher',[CourseController::class,'add_teacher'])->name('add_teacher');
Route::get('/get_teachers',[CourseController::class,'get_teachers'])->name('get_teachers');

Route::post('/add_course',[CourseController::class,'add_course'])->name('add_course');

Route::get('/group/{id}',[CrudController::class,'show_group'])->name('group');
Route::get('/friends', function () { return view('friends');});
Route::get('/puzzle', function () { return view('puzzle');});
Route::get('/course', function () { return view('course');});
Route::get('/invitation', function () { return view('invitation_posts');});
Route::get('/showcase', function () { return view('showcase_posts');});
Route::get('/question', function () { return view('question_posts');});
Route::get('/community', function () { return view('community_posts');});
Route::get('/profile', function () { return view('profile');});
Route::get('/add-friend/{user_id}', [FriendsController::class, 'add_friend'])->name('add_friend');
Route::get('/get-friend-status/{user_id}', [FriendsController::class, 'get_status'])->name('get_friend_status');
Route::get('/get-requests', [FriendsController::class, 'get_requests'])->name('get_requests');
Route::get('/beta-test', function () { return view('beta-test');});


Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');
});
