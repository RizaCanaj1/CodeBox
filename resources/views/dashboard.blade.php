<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/dashboard.css"/>
    <link rel="stylesheet" href="../assets/css/components/post.css"/>
    <link rel="stylesheet" href="../assets/css/components/code_box.css"/>
    <link rel="stylesheet" href="../assets/css/components/emojis.css"/>
    <link rel="stylesheet" href="../assets/css/components/stories.css"/>
    <link rel="stylesheet" href="../assets/css/components/chat.css"/>
    @php
        $notifications = App\Models\Notifications::where('user_id','=',auth()->id())->orderBy('id', 'DESC')->get();
    @endphp
    @if (session()->has('status'))
        @php
            $status = session('status');
        @endphp
        <div class="alert alert-info mb-4 w-75 pop_up">
            <ul>
                <li>{{ $status }}</li>
            </ul>
        </div>
    @endif

    <div class="db-shell">
        <div class="db-feed-col">
            @if ($errors->any())
                <div class="alert alert-info mb-4">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <div class='add-post'>
            @if(Auth::user()->hasPermissionTo('create post'))
                <form action='{{route("create_post")}}' method='POST' enctype="multipart/form-data" class="composer-form">
                    @csrf
                    <div class='composer-trigger'>
                        <img class="composer-avatar" src="{{ Auth::user()->profile_photo_path ? asset('storage/'.Auth::user()->profile_photo_path) : asset('assets/images/user.png') }}" alt="">
                        <input class='form-control composer-title-input' name='title' type="text" placeholder="What's on your mind?">
                        <button type="button" id='caret' class="composer-expand" aria-label="Expand composer"><i class="fa-solid fa-chevron-down"></i></button>
                    </div>
                    <div class='add_post_form d-none show_opacity'>
                        <div class='composer-row'>
                            <select name="type" id="type" class='type_of_post'>
                                <option value="">Post type</option>
                                <option value="invitation">Project invitation</option>
                                <option value="showcase">Project showcase</option>
                                <option value="question">Question</option>
                                <option value="community">Community post</option>
                            </select>
                            <label for="code" class='add-code d-none'><i class="fa-regular fa-file-code"></i> Add code</label>
                            <input type="file" name="code[]" class="code d-none" id='code' accept='text' multiple />
                            <label for="media" class='add-media d-none'><i class='fa-solid fa-image'></i> Add media</label>
                            <input type="file" name="media[]" class="media d-none" id='media' accept='image/video' multiple />
                        </div>
                        <textarea name="content" class='description' placeholder='Description'></textarea>
                        <div class='composer-footer'>
                            <button type="submit" class='post-btn'>Post</button>
                        </div>
                    </div>
                </form>
            @else
                <p class='composer-disabled'>You're not allowed to make posts yet. <a href="">Contact us</a></p>
            @endif
            </div>

            <div class='stories-wrapper'>
                <div class='stories' id="storiesBar">
                    <div class='m-story' id="addStoryCard">
                        <div class='d-flex justify-content-center user-s'>
                            <img src="{{ Auth::user()->profile_photo_path ? asset('storage/'.Auth::user()->profile_photo_path) : asset('assets/images/user.png') }}" alt="y-story">
                            <div class='add-story d-flex justify-content-center align-items-center'>
                                <label for="story"><i class='fas fa-plus text-white'></i></label>
                                @if(Auth::user()->hasPermissionTo('create stories'))
                                <input type="file" name="story" class="form-control story-media d-none" id='story' accept='image/*,video/*' />
                                @endif
                            </div>
                        </div>
                        <div class='d-flex justify-content-center mt-2'><button type="button" class='seethrow-btn' id="addStoryBtn">Add your story</button></div>
                    </div>
                    <!-- Other users' story rings are rendered here by stories.js -->
                </div>
            </div>

            <!-- Fullscreen story viewer — hidden until stories.js opens it. Sits
                 above everything (see .story-viewer z-index in stories.css) and
                 locks body scroll while open, so the dashboard behind it can't
                 be scrolled/interacted with until it's closed. -->
            <div class="story-viewer d-none" id="storyViewer">
                <div class="story-viewer-stage">
                    <div class="story-progress" id="storyProgress"></div>
                    <div class="story-viewer-header">
                        <img class="story-viewer-avatar" id="storyViewerAvatar" src="" alt="">
                        <span class="story-viewer-username" id="storyViewerUsername"></span>
                        <span class="story-viewer-time" id="storyViewerTime"></span>
                        <div class="story-viewer-actions">
                            <button type="button" class="story-highlight-btn d-none" id="storyHighlightBtn" title="Save to highlights"><i class="far fa-star"></i></button>
                            <button type="button" class="story-expand-btn" id="storyExpandBtn" title="Expand to fit image"><i class="fas fa-expand"></i></button>
                            <button type="button" class="story-close-btn" id="storyCloseBtn" title="Close"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    <div class="story-viewer-media" id="storyViewerMedia"></div>
                    <button type="button" class="story-nav-btn story-nav-prev d-none" id="storyPrevBtn"><i class="fas fa-chevron-left"></i></button>
                    <button type="button" class="story-nav-btn story-nav-next" id="storyNextBtn"><i class="fas fa-chevron-right"></i></button>
                    <div class="story-tap-zone story-tap-prev" id="storyTapPrev"></div>
                    <div class="story-tap-zone story-tap-next" id="storyTapNext"></div>
                    <div class="story-viewers-panel d-none" id="storyViewersPanel">
                        <i class="fas fa-eye"></i> <span id="storyViewersCount">0</span> views
                    </div>
                </div>
            </div>

            <div class='posts'></div>

            <!-- Shared backdrop for post fullscreen focus mode (see
                 openPostFullscreen()/.post-fullscreen in post.js/post.css) —
                 one element reused by whichever post is currently focused,
                 not one per post. -->
            <div class="post-fullscreen-backdrop d-none" id="postFullscreenBackdrop"></div>
        </div>

        <aside class='profile-chat'>
            <div class='pc-card'>
                <div class="pc-card-head">
                    <span>Notifications</span>
                    <span class='notifications_btn'>{{$notifications->where('status','=','delivered')->count()}}</span>
                </div>
                <div class='notifications d-none'>
                @if($notifications->count()>0)
                    @for($i=0;$i<($notifications->count());$i++)
                    @php
                        $type_of = strtolower(str_replace(' ', '_', explode('| ', $notifications[$i]['title'])[1]));
                    @endphp
                        <div class="notification {{$notifications[$i]['status']}}">
                            <h6 class="nid-{{$notifications[$i]['id']}} {{$type_of}}" id="id-{{$notifications[$i]['post_id']}}">{{$notifications[$i]['title']}}</h6>
                            <p>From: <a href="/profile?id={{$notifications[$i]['from_user_id']}}">{{Illuminate\Foundation\Auth\User::find($notifications[$i]['from_user_id'])['name']}}</a></p>
                            <p>{{$notifications[$i]['content']}}</p>
                            @if($i != $notifications->count()-1)
                            <hr>
                            @endif
                        </div>
                    @endfor
                @else
                    <div class="notification text-danger">
                        <h6>No notifications</h6>
                    </div>
                @endif
                </div>
            </div>

            <div class='pc-card'>
                <div class="pc-card-head"><span>Filter</span></div>
                <div class='filter' id="dashboardFilter">
                    <a href="#" data-type="invitation">Invitation</a>
                    <a href="#" data-type="showcase">Showcase</a>
                    <a href="#" data-type="question">Questions</a>
                    <a href="#" data-type="community">Community</a>
                </div>
            </div>
        </aside>
    </div>

    <!-- Floating chat widget — messages with anyone you've friend-requested
         (either direction) or already exchanged messages with. See
         ChatController for why it's not gated on an "accepted" friendship:
         nothing in this app ever marks a request accepted yet. -->
    <div class="chat-widget" id="chatWidget">
        <button type="button" class="chat-toggle-btn" id="chatToggleBtn" aria-label="Toggle chat">
            <i class="fa-solid fa-comment-dots"></i>
            <span class="chat-unread-badge d-none" id="chatUnreadBadge">0</span>
        </button>
        <div class="chat-panel d-none" id="chatPanel">
            <div class="chat-panel-header">
                <button type="button" class="chat-back-btn d-none" id="chatBackBtn" aria-label="Back to conversations"><i class="fa-solid fa-arrow-left"></i></button>
                <span class="chat-panel-title" id="chatPanelTitle">Messages</span>
                <button type="button" class="chat-close-btn" id="chatCloseBtn" aria-label="Close chat"><i class="fa-solid fa-times"></i></button>
            </div>
            <div class="chat-conversations" id="chatConversations"></div>
            <div class="chat-thread d-none" id="chatThread">
                <div class="chat-messages" id="chatMessages"></div>
                <form class="chat-input-form" id="chatInputForm">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Type a message" autocomplete="off">
                    <button type="submit" class="chat-send-btn" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- theme.js is already loaded once, site-wide, by layouts/app.blade.php -->
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/components/emojis.js"></script>
    <script src="assets/js/components/comments.js"></script>
    <script src="assets/js/components/post.js"></script>
    <script src="assets/js/components/code_box.js"></script>
    <script src="assets/js/components/stories.js"></script>
    <script src="assets/js/components/chat.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>
