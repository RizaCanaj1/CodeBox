<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\CrudController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ApplicationsController;

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

Route::get('/get-user/{user_id}', [CrudController::class, 'get_user']);
Route::get('/get-posts', [CrudController::class, 'get_posts'])->name('posts');
Route::get('/get-post-code/{id}', [CrudController::class, 'post_codes'])->name('post_codes');
Route::get('/get-group-users/{id}',[CrudController::class,'get_group_users'])->name('get_group_users');
Route::get('/get-posts-from-user/{id}', [PostController::class, 'get_posts_from_user'])->name('posts_from_user');
Route::get('/read_notification/{id}', [NotificationsController::class, 'read_notification'])->name('read_notification');

Route::get('/applications/{id}',  [ApplicationsController::class, 'get_applications'])->name('applications');
Route::post('/applications/{id}',  [ApplicationsController::class, 'apply'])->name('applications');
Route::get('/handle_applications/{id}',[ApplicationsController::class, 'handle_applications'])->name('handle_applications');

Route::get('/group/{id}',[CrudController::class,'show_group'])->name('group');
Route::get('/invitation', function () { return view('invitation_posts');});
Route::get('/showcase', function () { return view('showcase_posts');});
Route::get('/question', function () { return view('question_posts');});
Route::get('/community', function () { return view('community_posts');});
Route::get('/profile', function () { return view('profile');});
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
