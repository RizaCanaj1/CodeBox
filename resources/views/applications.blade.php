<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/applications.css"/>
    @if (session()->has('test'))
        @php
            $test = session('test');
        @endphp
        <div class="alert alert-info mb-4 w-75 pop_up">
            <pre>{{ print_r($test) }}</pre>
        </div>
    @endif
    <div class='container'>
        <div class='mt-5'>
            <h1>{{$post['title']}}</h1>
            <h4>Needs:</h4>
            <div class='content mt-2'>
                <p>{{$post['content']}}</p>
            </div>
            @if(auth()->id()!=$post->user()->get('id')[0]['id'])
                <h4>Requests:</h4>
                <div class='requests'>
                <p>This application has no requests</p>
                    @php 
                        $my_status = $post->invitations()->where('from_user_id','=',auth()->id())
                    @endphp
                    @if($my_status->count() > 0)
                        @if($my_status->count() >= 5 && $my_status->latest()->first()['status'] == 'refused')
                            <a class="p-2 bg-danger text-white rounded-3">Contact the owner for more informations!</a>
                        @elseif($my_status->latest()->first()['status'] == 'approved')
                            <a href="/group/{{$post['id']}}" class="btn btn-secondary">Group</a>
                        @elseif($my_status->latest()->first()['status'] == 'pending')
                            <p class="p-2 bg-warning text-white rounded-3 d-inline-block">Wait for response</p>
                        @else 
                        <form action="" method='POST'>
                        @csrf
                            <button class='btn btn-primary'>Apply</button>
                        </form>
                        @endif
                    @else
                    <form action="" method='POST'>
                    @csrf
                        <button class='btn btn-primary'>Apply</button>
                    </form>
                    @endif
                </div>
            @else
                @if($post->invitations()->count() > 0)
                    <button class='btn btn-success' onClick='openApplications()'>Invitations</button>
                    <div class='applications d-none p-4'>
                        <form class='applications-form' action="{{ route('handle_applications', ['id' => $post['id']]) }}" medhod='POST'>
                            @csrf
                            <div class='d-flex align-items-start'>
                                <a class='back_to_posts position-fixed' onClick="closeApplications()"><i class="fa-solid fa-arrow-rotate-left fa-l p-2 rounded-circle"></i></a>
                                <h2 class='mb-4 w-100 text-center'>Applicants({{$post->invitations()->where('status','like','pending')->count()}})</h2>
                            </div>
                            <div class='mx-2 row gap-4'>
                            @foreach($post->invitations()->where('status','like','pending')->get() as $invitations)
                                <div class='col-6 user-checkbox d-flex align-items-center rounded-2'>
                                    <input type="checkbox" class='selector rounded text-dark' id="check-{{$invitations->user()->get('id')[0]['id']}}" name="check[]" value="{{$invitations->user()->get('id')[0]['id']}}">
                                    <a class="show-user-{{$invitations->user()->get('id')[0]['id']}} mx-2 ">{{$invitations->user()->get('name')[0]['name']}}</a>
                                </div>
                            @endforeach
                            </div>
                            <div class='flex flex-row-reverse'>
                                <a><strong>Refused</strong></a>
                            </div>
                            <div class='mt-2 d-flex justify-content-center gap-4'>
                                <button class='btn btn-success' name='approve'><i class="fa-solid fa-check"></i>Aprove</button>
                                <button class='btn btn-danger' name='refuse'><i class="fa-solid fa-xmark"></i>Refuse</button> 
                            </div>
                        </form>
                        <div class='applicant d-none d-flex'>
                            <a class='back_to_applicants'><i class="fa-solid fa-arrow-rotate-left fa-l p-2 rounded-circle"></i></a>
                            <img class='user-img rounded-circle' src="../assets/images/user.png" alt="user">
                            <div class='bg-dark text-white ms-4 p-2 rounded-3 w-75'>
                                <h4 class="user-name text-center mb-3">Ylber Veliu</h4>
                                <div class="d-flex justify-content-around align-items-center">
                                    <div>
                                        <h6>Projects:  <a href="" class='text-danger'>26</a></h6>
                                        <h6>Rating:  <a href="" class='text-danger'>95%</a></h6>
                                        <h6>Score:  65140</h6>
                                    </div>
                                    <div>
                                        <a class="btn btn-primary">Message</a>
                                    </div>
                                </div>
                                <div class='mt-2 d-flex justify-content-center gap-4'>
                                    <button class='btn btn-success' name='apply'><i class="fa-solid fa-check"></i>Aprove</button>
                                    <button class='btn btn-danger' name='apply'><i class="fa-solid fa-xmark"></i>Refuse</button> 
                                </div>
                            </div>
                        </div>
                    </div>
                @else
                    <p class='bg-danger d-inline-block p-2 rounded-4 text-white'>This post has no applications</p>
                @endif
                <a href="/group/{{$post['id']}}" class="btn btn-secondary">Group</a>
            @endif
        </div>
    </div>
    <script src="../assets/js/applications.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>
