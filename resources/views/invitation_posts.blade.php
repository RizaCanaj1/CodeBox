<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/dashboard.css"/>
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
                        <i class='fa-solid fa-plus text-white'></i>
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
            <p>Invitations <span>0</span></p>
            <p>Post notifications <span>0</span></p>
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
        $posts = App\Models\Posts::where('type','=','invitation')->orderByRaw('RAND()')->get();
    @endphp
    <div class='posts'>
        <div>
            @for($i=0;$i<($posts->count());$i++)
                @if($i%2==0)
                    <div class="pid-{{$posts[$i]['id']}} post pinvitation mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p> 
                        </div>
                        <div class='d-flex gap-2'>
                            <button class='btn btn-outline-primary'>Apply</button> <div class='pt-2 d-flex gap-1'><i class="fa-solid fa-box-open fa-lg pt-2 mt-1"></i><p>5</p></div>
                        </div>
                    </div>
                @endif
            @endfor
        </div>
        <div>
            @for($i=0;$i<($posts->count());$i++)
                @if($i%2!=0)
                <div class="pid-{{$posts[$i]['id']}} post pinvitation mt-4 ms-4 bg-light">
                        <div class='title-from d-flex justify-content-between gap-2'>
                            <h3>{{$posts[$i]['title']}}</h3>
                            <div class='from d-flex gap-3'>
                                <a href="">{{$posts[$i]->user()->get('name')[0]['name']}}</a>
                                <img src="./assets/images/user.png" alt="user">
                            </div>
                        </div>
                        <div class='pdescription'>
                            <p>{{$posts[$i]['content']}}</p> 
                        </div>
                        <div class='d-flex gap-2'>
                            <button class='btn btn-outline-primary'>Apply</button> <div class='pt-2 d-flex gap-1'><i class="fa-solid fa-box-open fa-lg pt-2 mt-1"></i><p>5</p></div>
                        </div>
                    </div>
                @endif
            @endfor
        </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>
