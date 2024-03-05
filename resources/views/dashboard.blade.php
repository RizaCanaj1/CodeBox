<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/dashboard.css"/>
    <pre>
    @php
        $notifications = App\Models\Notifications::where('user_id','=',auth()->id())->orderBy('id', 'DESC')->get();
    @endphp
    </pre>
    @if (session()->has('pop_up'))
        @php
            $pop_up = session('pop_up');
        @endphp
        <div class="alert alert-info mb-4 w-75 pop_up">
            <ul>
                <li>{{ $pop_up }}</li>
            </ul>
        </div>
    @endif
    <div class="left-container">
        @if ($errors->any())
            <div class="alert alert-info mb-4">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        <div class='add-post position-absolute bg-light ms-4 mt-4 p-4 rounded'>
        @if(Auth::user()->hasPermissionTo('create post'))
            <form action='{{route("create_post")}}' method='POST' enctype="multipart/form-data">
                @csrf
                <div class='from-group d-flex align-items-center justify-content-center gap-3 ms-3 mt-3'>
                    <input class='form-control w-75' name='title' type="text" placeholder="What's on your mind?">
                    <i class="fa-solid fa-caret-right" id='caret'></i>
                </div>
                <div class='from-group mt-4 d-flex justify-content-center'>
                <select name="type" id="type" class='type_of_post d-none rounded'>
                    <option value="">Type</option>
                    <option value="invitation">Project invitation</option>
                    <option value="showcase">Project showcase</option>
                    <option value="question">Question</option>
                    <option value="community">Community post</option>
                </select>
                </div>
                <div class='from-group mt-4 d-flex justify-content-center'>
                    <label for="code" class='add-code d-none'>Add Code <i class="fa-regular fa-file-code"></i></label>
                    <input type="file" name="code[]" class="form-control code d-none" id='code' accept='text' multiple /> 
                    <label for="media" class='add-media d-none'>Add Media<i class='fa-solid fa-plus fa-xs'></i></label>
                    <input type="file" name="media[]" class="form-control media d-none" id='media' accept='image/video' multiple /> 
                </div>
                <div class='from-group mt-4 d-flex justify-content-center'>
                    <textarea name="content" class='description d-none' placeholder='Description:'></textarea>
                </div>
                <div class='d-flex justify-content-center mt-2'>
                    <button class='post-btn py-1 px-2'>Post</button>
                </div>
                
            </form>
        @else
        <p class='text-danger'>You are not allowed to make posts. <a href="">Contact us</a><p>
        @endif 
        </div>
        <div>
           
        </div>
        <div class='d-flex justify-content-end gap-5'>
            <div class='stories mt-4'>
                <div class='m-story bg-light'>
                    <div class='add-story d-flex justify-content-center align-items-center'>
                        <label for="story"><i class='fa-solid fa-plus text-white'></i></label>
                        <input type="file" name="story[]" class="form-control story-media d-none" id='story' accept='image/video' multiple /> 
                    </div>
                    <div class='d-flex justify-content-center user-s'>
                        <img src="./assets/images/user.png" alt="y-story">
                    </div>
                    <div class='d-flex justify-content-center mt-2'><button class='seethrow-btn'>Add your story</button></div>
                </div>
                <div class='story'>
                    <div class='i-story d-flex justify-content-center align-items-center'>
                        <img src="./assets/images/nature.png" alt="nature-s">
                    </div>
                    <div class='d-flex justify-content-center user-s'>
                        <img src="./assets/images/user.png" alt="y-story">
                    </div>
                </div>
                <div class='story'>
                    <div class='i-story d-flex justify-content-center align-items-center'>
                        <img src="./assets/images/nature.png" alt="nature-s">
                    </div>
                    <div class='d-flex justify-content-center user-s'>
                        <img src="./assets/images/user.png" alt="y-story">
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class='profile-chat'>
        <p>Infos:</p>
        <div class='infos'>
            <p>Notifications <span class='notifications_btn'>{{$notifications->where('status','=','delivered')->count()}}</span></p>
        </div>
        <div class='notifications d-none'>
        @if($notifications->count()>0)
            @for($i=0;$i<($notifications->count());$i++)
                <div class="notification {{$notifications[$i]['status']}}">
                    <h6 class="nid-{{$notifications[$i]['id']}}" id="id-{{$notifications[$i]['post_id']}}">{{$notifications[$i]['title']}}</h6>
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
        <hr/>
        <p>Filter:</p>
        <div class='filter'>
            <a href="/invitation" class='bg-light'>Invitation</a>
            <a href="/showcase" class='bg-light'>Showcase</a>
            <a href="/question" class='bg-light'>Questions</a>
            <a href="/community" class='bg-light'>Community</a>
        </div>
        <hr/>
        <p>Chat:</p>
        <div class='chats bg-light'>
            @for($i=0;$i<'8';$i++)
            <div class='chat w-100 d-flex justify-content-between'>
                <img src="./assets/images/user.png" alt="user">
                <button class='seethrow-btn ms-2'>Riza</button>
                <p class='c-content pt-3'>I would love to work wi...</p>
                <p class='pt-3'>Today</p>
            </div>
            @endfor
            
        </div>
    </div>
    @php
        $posts = App\Models\Posts::orderByRaw('RAND()')->get();
    @endphp
    <div class='posts'>
        <div>
            @for($i=0;$i<($posts->count());$i++)
                @if($i%2==0)
                    @if($posts[$i]['type']=='question')
                    <div class="pid-{{$posts[$i]['id']}} post pquestion mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p>
                        </div>
                        <div class='d-flex justify-content-between mt-4'>
                            <div class='d-flex w-75 gap-2'> 
                                <i class="comments_id-{{$posts[$i]['id']}} fa-solid fa-comment fa-lg pt-2"></i>
                                <p class="counter-{{$posts[$i]['id']}}">{{$posts[$i]->comments()->count()}}</p>
                                <i class="fa-solid fa-box-open fa-lg pt-2"></i><p>5</p>
                                <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                            </div>
                            <p>Views:4k</p>
                        </div>
                        <div class='d-none comments' id="comments_id-{{$posts[$i]['id']}}">
                            <hr>
                            @if(($posts[$i]->comments()->count())>0)
                                @foreach($posts[$i]->comments()->get() as $comment)
                                    <p>{{$comment['content']}}</p>
                                @endforeach
                            @else
                                <p class='text-danger'>This post has no comments, be first to comment</p>
                            @endif
                        </div>
                        <form class='add-comment d-none justify-content-between gap-2' id="fid-{{$posts[$i]['id']}}">
                            @csrf
                            <input class='form-control' type="text" name='content'>
                            <button class='btn btn-dark'>Send</button>
                        </form>
                    </div>
                    @elseif($posts[$i]['type']=='showcase')
                    <div class="pid-{{$posts[$i]['id']}} post pshowcase mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3 >{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p>
                        </div>
                        <div class='d-flex justify-content-center'>
                            @if(($posts[$i]->code()->count())>0)
                            @php
                                $code = fopen("storage/codes/".$posts[$i]->code()->get('source')[0]['source'], "r") or die("Unable to open file!");
                                $code = fread($code,filesize("storage/codes/".$posts[$i]->code()->get('source')[0]['source']));
                            @endphp
                            <button class="pid-{{$posts[$i]['id']}} seethrow-btn codebox-animation"><p class="pid-{{$posts[$i]['id']}}">{{'<'}}<span class="pid-{{$posts[$i]['id']}} m_between_code"></span>/<span class="pid-{{$posts[$i]['id']}} nr_of_code">{{$posts[$i]->code()->count()}}CodeBox</span><span class="pid-{{$posts[$i]['id']}} m_between_code"></span>></p></button>
                            <p><pre class='codeblock d-none align-items-center flex-column' id="pid-{{$posts[$i]['id']}}">
                                @foreach($posts[$i]->code()->get() as $source)
                                @if ((explode(".", $source['source'])[1])=='html')
                                <div><button class="pid-{{$posts[$i]['id']}} source-btn">{{$source['source']}}</button> <button class="pid-{{$posts[$i]['id']}} test-beta" title='This feature is still in develop. This works only for simple html files as for now'>Beta Open</button></div>
                                @else
                                <button class="pid-{{$posts[$i]['id']}} source-btn">{{$source['source']}}</button>
                                @endif
                               
                                @endforeach
                            </pre></p>
                            @endif
                        </div>
                        <div class='d-flex justify-content-between mt-4'>
                            <div class='d-flex w-75 gap-2'> 
                                <i class="comments_id-{{$posts[$i]['id']}} fa-solid fa-comment fa-lg pt-2"></i>
                                <p class="counter-{{$posts[$i]['id']}}">{{$posts[$i]->comments()->count()}}</p>
                                <i class="fa-solid fa-box-open fa-lg pt-2" id='box_id-1'></i><p>5</p>
                                <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                            </div>
                            <p>Views:4k</p>
                        </div>
                        <div class='d-none comments' id="comments_id-{{$posts[$i]['id']}}">
                            <hr>
                            @if(($posts[$i]->comments()->count())>0)
                                @foreach($posts[$i]->comments()->get() as $comment)
                                    <p>{{$comment['content']}}</p>
                                @endforeach
                            @else
                                <p class='text-danger'>This post has no comments, be first to comment</p>
                            @endif
                        </div>
                        <form class='add-comment d-none justify-content-between gap-2' id="fid-{{$posts[$i]['id']}}">
                            @csrf
                            <input class='form-control' type="text" name='content'>
                            <button class='btn btn-dark'>Send</button>
                        </form>
                    </div>
                    @elseif($posts[$i]['type']=='invitation')
                    <div class="pid-{{$posts[$i]['id']}} post pinvitation mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p> 
                        </div>
                        <div class='d-flex gap-2'>
                            @if(auth()->id()!=$posts[$i]->user()->get('id')[0]['id'])
                                @php 
                                    $my_status = $posts[$i]->invitations()->where('from_user_id','=',auth()->id())
                                @endphp
                                @if($my_status->count() > 0)
                                    @if($my_status->count() >= 5 && $my_status->latest()->first()['status'] == 'refused')
                                    <a class="p-2 bg-danger text-white rounded-3">Contact the owner for more informations!</a>
                                    @elseif($my_status->latest()->first()['status'] == 'approved')
                                    <a href="/group/{{$posts[$i]['id']}}" class="btn btn-secondary">Group</a>
                                    @elseif($my_status->latest()->first()['status'] == 'pending')
                                    <a href='applications/{{$posts[$i]["id"]}}' class="p-2 bg-warning text-white rounded-3">Wait for response</a>
                                    @else
                                    <a href='applications/{{$posts[$i]["id"]}}' class="btn btn-outline-primary">Apply</a>
                                    @endif
                                @else
                                    <a href='applications/{{$posts[$i]["id"]}}' class="btn btn-outline-primary">Apply</a>
                                @endif
                            @else
                            <a href='applications/{{$posts[$i]["id"]}}' class="btn btn-outline-success">View applications</a>
                            @endif 
                            
                            <div class='pt-2 d-flex gap-1'>
                                <i class="fa-solid fa-box-open fa-lg pt-2 mt-1"></i><p>5</p>
                                <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                            </div>
                        </div>
                    </div>
                    @elseif($posts[$i]['type']=='community')
                    <div class="pid-{{$posts[$i]['id']}} post pcommunity mt-4 ms-4 mb-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3 class='w-75'>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p>
                            @if(($posts[$i]->media()->count())>1)
                                <div class='p-mimage'>
                                    @if(($posts[$i]->media()->count()) < 4)
                                        @foreach($posts[$i]->media()->get('source') as $source)
                                        <img src="./storage/media/{{$source['source']}}" alt="{{$source['source']}}">
                                        @endforeach
                                        @if(($posts[$i]->media()->count()) == 2)
                                        <a class="pid-{{$posts[$i]['id']}}">View More</a>
                                        @endif
                                    @else
                                        @for($x=0;$x < $posts[$i]->media()->count();$x++)
                                            @if($x > 1)
                                            <img class='hidden-images'  src="./storage/media/{{$posts[$i]->media()->get('source')[$x]['source']}}" alt="laravel">
                                            @else
                                            <img src="./storage/media/{{$posts[$i]->media()->get('source')[$x]['source']}}" alt="laravel">
                                            @endif
                                        @endfor
                                        <a class="pid-{{$posts[$i]['id']}}">View More</a>
                                    @endif
                                </div>
                            @elseif(($posts[$i]->media()->count())==1)
                                <div class='pimage d-flex justify-content-center'>
                                    <img src="./storage/media/{{$posts[$i]->media()->get('source')[0]['source']}}" alt="laravel">
                                </div>
                            @else
                                <div class='pimage d-flex justify-content-center'>
                                    <img src="./assets/images/laravel.png" alt="laravel">
                                </div>
                            @endif
                            <div class='d-flex justify-content-between mt-4'>
                                <div class='d-flex w-75 gap-2'> 
                                    <i class="comments_id-{{$posts[$i]['id']}} fa-solid fa-comment fa-lg pt-2"></i>
                                    <p class="counter-{{$posts[$i]['id']}}">{{$posts[$i]->comments()->count()}}</p>
                                    <i class="fa-solid fa-box-open fa-lg pt-2"></i><p>5</p>
                                    <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                                </div>
                                <p>Views:4k</p>
                            </div>
                            <div class='d-none comments' id="comments_id-{{$posts[$i]['id']}}">
                                <hr>
                                @if(($posts[$i]->comments()->count())>0)
                                    @foreach($posts[$i]->comments()->get() as $comment)
                                        <p>{{$comment['content']}}</p>
                                    @endforeach
                                @else
                                    <p class='text-danger'>This post has no comments, be first to comment</p>
                                @endif
                            </div>
                            <form class='add-comment d-none justify-content-between gap-2' id="fid-{{$posts[$i]['id']}}">
                                @csrf
                                <input class='form-control' type="text" name='content'>
                                <button class='btn btn-dark'>Send</button>
                            </form>
                        </div>
                    </div>
                    @endif
                @endif
            @endfor
        </div>
        <div>
            @for($i=0;$i<($posts->count());$i++)
                @if($i%2!=0)
                    @if($posts[$i]['type']=='question')
                    <div class="pid-{{$posts[$i]['id']}} post pquestion mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p>
                        </div>
                        <div class='d-flex justify-content-between mt-4'>
                            <div class='d-flex w-75 gap-2'> 
                                <i class="comments_id-{{$posts[$i]['id']}} fa-solid fa-comment fa-lg pt-2"></i>
                                <p class="counter-{{$posts[$i]['id']}}">{{$posts[$i]->comments()->count()}}</p>
                                <i class="fa-solid fa-box-open fa-lg pt-2"></i><p>5</p>
                                <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                            </div>
                            <p>Views:4k</p>
                        </div>
                        <div class='d-none comments' id="comments_id-{{$posts[$i]['id']}}">
                            <hr>
                            @if(($posts[$i]->comments()->count())>0)
                                @foreach($posts[$i]->comments()->get() as $comment)
                                    <p>{{$comment['content']}}</p>
                                @endforeach
                            @else
                                <p class='text-danger'>This post has no comments, be first to comment</p>
                            @endif
                        </div>
                        <form class='add-comment d-none justify-content-between gap-2' id="fid-{{$posts[$i]['id']}}">
                            @csrf
                            <input class='form-control' type="text" name='content'>
                            <button class='btn btn-dark'>Send</button>
                        </form>
                    </div>
                    @elseif($posts[$i]['type']=='showcase')
                    <div class="pid-{{$posts[$i]['id']}} post pshowcase mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3 >{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                            <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p>
                        </div>
                        <div class='d-flex justify-content-center'>
                            @if(($posts[$i]->code()->count())>0)
                            @php
                                $code = fopen("storage/codes/".$posts[$i]->code()->get('source')[0]['source'], "r") or die("Unable to open file!");
                                $code = fread($code,filesize("storage/codes/".$posts[$i]->code()->get('source')[0]['source']));
                            @endphp
                            <button class="pid-{{$posts[$i]['id']}} seethrow-btn codebox-animation"><p class="pid-{{$posts[$i]['id']}}">{{'<'}}<span class="pid-{{$posts[$i]['id']}} m_between_code"></span>/<span class="pid-{{$posts[$i]['id']}} nr_of_code">{{$posts[$i]->code()->count()}}CodeBox</span><span class="pid-{{$posts[$i]['id']}} m_between_code"></span>></p></button>
                            @if(($posts[$i]->code()->count())==1)
                            <p><pre class='codeblock d-none' id="pid-{{$posts[$i]['id']}}">File name: {{$posts[$i]->code()->get()[0]['source']}} <br/>{{$code}}</pre></p>
                            @else
                            <p><pre class='codeblock d-none align-items-center flex-column' id="pid-{{$posts[$i]['id']}}">
                                @foreach($posts[$i]->code()->get() as $source)
                                <button class="pid-{{$posts[$i]['id']}} source-btn">{{$source['source']}}</button>
                                @endforeach
                            </pre></p>
                            @endif
                            @endif
                        </div>
                        <div class='d-flex justify-content-between mt-4'>
                            <div class='d-flex w-75 gap-2'> 
                                <i class="comments_id-{{$posts[$i]['id']}} fa-solid fa-comment fa-lg pt-2"></i>
                                <p class="counter-{{$posts[$i]['id']}}">{{$posts[$i]->comments()->count()}}</p>
                                <i class="fa-solid fa-box-open fa-lg pt-2" id='box_id-1'></i><p>5</p>
                                <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                            </div>
                            <p>Views:4k</p>
                        </div>
                        <div class='d-none comments' id="comments_id-{{$posts[$i]['id']}}">
                            <hr>
                            @if(($posts[$i]->comments()->count())>0)
                                @foreach($posts[$i]->comments()->get() as $comment)
                                    <p>{{$comment['content']}}</p>
                                @endforeach
                            @else
                                <p class='text-danger'>This post has no comments, be first to comment</p>
                            @endif
                        </div>
                        <form class='add-comment d-none justify-content-between gap-2' id="fid-{{$posts[$i]['id']}}">
                            @csrf
                            <input class='form-control' type="text" name='content'>
                            <button class='btn btn-dark'>Send</button>
                        </form>
                    </div>
                    @elseif($posts[$i]['type']=='invitation')
                    <div class="pid-{{$posts[$i]['id']}} post pinvitation mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p> 
                        </div>
                        <div class='d-flex gap-2'>
                            @if(auth()->id()!=$posts[$i]->user()->get('id')[0]['id'])
                                @php 
                                    $my_status = $posts[$i]->invitations()->where('from_user_id','=',auth()->id())
                                @endphp
                                @if($my_status->count() > 0)
                                    @if($my_status->count() >= 5 && $my_status->latest()->first()['status'] == 'refused')
                                    <a class="p-2 bg-danger text-white rounded-3">Contact the owner for more informations!</a>
                                    @elseif($my_status->latest()->first()['status'] == 'approved')
                                    <a href="/group/{{$posts[$i]['id']}}" class="btn btn-secondary">Group</a>
                                    @elseif($my_status->latest()->first()['status'] == 'pending')
                                    <a href='applications/{{$posts[$i]["id"]}}' class="p-2 bg-warning text-white rounded-3">Wait for response</a>
                                    @else
                                    <a href='applications/{{$posts[$i]["id"]}}' class="btn btn-outline-primary">Apply</a>
                                    @endif
                                @else
                                    <a href='applications/{{$posts[$i]["id"]}}' class="btn btn-outline-primary">Apply</a>
                                @endif
                            @else
                            <a href='applications/{{$posts[$i]["id"]}}' class="btn btn-outline-success">View applications</a>
                            @endif 
                            <div class='pt-2 d-flex gap-1'>
                                <i class="fa-solid fa-box-open fa-lg pt-2 mt-1"></i><p>5</p>
                                <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                            </div>
                        </div>
                    </div>
                    @elseif($posts[$i]['type']=='community')
                    <div class="pid-{{$posts[$i]['id']}} post pcommunity mt-4 ms-4 mb-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3 class='w-75'>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="/profile?id={{$posts[$i]->user()->get('id')[0]['id']}}">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p>
                            @if(($posts[$i]->media()->count())>1)
                                <div class='p-mimage'>
                                    @if(($posts[$i]->media()->count()) < 4)
                                        @foreach($posts[$i]->media()->get('source') as $source)
                                        <img src="./storage/media/{{$source['source']}}" alt="{{$source['source']}}">
                                        @endforeach
                                        @if(($posts[$i]->media()->count()) == 2)
                                        <a class="pid-{{$posts[$i]['id']}}" >View More</a>
                                        @endif
                                    @else
                                        @for($x=0;$x < $posts[$i]->media()->count();$x++)
                                            @if($x > 1)
                                            <img class='hidden-images'  src="./storage/media/{{$posts[$i]->media()->get('source')[$x]['source']}}" alt="laravel">
                                            @else
                                            <img src="./storage/media/{{$posts[$i]->media()->get('source')[$x]['source']}}" alt="laravel">
                                            @endif
                                        @endfor
                                        <a class="pid-{{$posts[$i]['id']}}">View More</a>
                                    @endif
                                </div>
                            @elseif(($posts[$i]->media()->count())==1)
                                <div class='pimage d-flex justify-content-center'>
                                    <img src="./storage/media/{{$posts[$i]->media()->get('source')[0]['source']}}" alt="laravel">
                                </div>
                            @else
                                <div class='pimage d-flex justify-content-center'>
                                    <img src="./assets/images/laravel.png" alt="laravel">
                                </div>
                            @endif
                            <div class='d-flex justify-content-between mt-4'>
                                <div class='d-flex w-75 gap-2'> 
                                    <i class="comments_id-{{$posts[$i]['id']}} fa-solid fa-comment fa-lg pt-2"></i>
                                    <p class="counter-{{$posts[$i]['id']}}">{{$posts[$i]->comments()->count()}}</p>
                                    <i class="fa-solid fa-box-open fa-lg pt-2"></i><p>5</p>
                                    <a href="/{{$posts[$i]['type']}}">#{{$posts[$i]['type']}}</a>
                                </div>
                                <p>Views:4k</p>
                            </div>
                            <div class='d-none comments' id="comments_id-{{$posts[$i]['id']}}">
                                <hr>
                                @if(($posts[$i]->comments()->count())>0)
                                    @foreach($posts[$i]->comments()->get() as $comment)
                                        <p>{{$comment['content']}}</p>
                                    @endforeach
                                @else
                                    <p class='text-danger'>This post has no comments, be first to comment</p>
                                @endif
                            </div>
                            <form class='add-comment d-none justify-content-between gap-2' id="fid-{{$posts[$i]['id']}}">
                                @csrf
                                <input class='form-control' type="text" name='content'>
                                <button class='btn btn-dark'>Send</button>
                            </form>
                        </div>
                    </div>
                    @endif
                @endif
            @endfor
        </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/components/code_box.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>
