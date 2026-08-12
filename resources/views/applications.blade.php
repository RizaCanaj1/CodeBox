<x-app-layout>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/components/post.css"/>
    <link rel="stylesheet" href="../assets/css/applications.css"/>

    @php
        $isOwner = auth()->id() == $post->user_id;
    @endphp

    <div class="applications-shell">
        @if(session('pop_up'))
            <div class="app-alert">{{ session('pop_up') }}</div>
        @endif
        @if(session('message'))
            <div class="app-alert">{{ session('message') }}</div>
        @endif

        <div class="app-card">
            <div class="app-card-head">
                <span class="post-type-badge type-invitation">Invitation</span>
                <div class="app-owner">
                    <img src="{{ $post->user->profile_photo_path ? asset('storage/'.$post->user->profile_photo_path) : asset('assets/images/user.png') }}" alt="{{ $post->user->name }}">
                    <span>{{ $post->user->name }}</span>
                </div>
            </div>

            <h1 class="app-title">{{ $post->title }}</h1>
            <p class="app-content">{{ $post->content }}</p>

            <div class="post-invitation-meta">
                <span class="pinv-chip"><i class="fa-solid fa-code"></i> {{ $post->programming_languages ?? 'Not defined' }}</span>
                <span class="pinv-chip"><i class="fa-regular fa-clock"></i> {{ $post->working_hours ?? 'Not defined' }}</span>
                <span class="pinv-chip pinv-chip-payment"><i class="fa-solid fa-sack-dollar"></i> {{ $post->payment ?? 'Free' }}</span>
            </div>

            @unless($isOwner)
                <div class="app-apply-section">
                    @if(!$my_application)
                        <form action="{{ route('apply', ['id' => $post->id]) }}" method="POST">
                            @csrf
                            <button class="app-btn app-btn-primary">Apply</button>
                        </form>
                    @elseif($my_application->status == 'approved')
                        <a href="/group/{{ $post->id }}" class="app-btn app-btn-secondary">Go to group</a>
                    @elseif($my_application->status == 'pending')
                        <span class="app-status app-status-pending"><i class="fa-regular fa-clock"></i> Waiting for response</span>
                    @else
                        <span class="app-status app-status-refused"><i class="fa-solid fa-xmark"></i> Your application was not selected. Contact the owner for more information.</span>
                    @endif
                </div>
            @else
                @php
                    $pending = $post->invitations()->where('status', 'pending')->get();
                    $approvedCount = $post->invitations()->where('status', 'approved')->count();
                    $refusedCount = $post->invitations()->where('status', 'refused')->count();
                @endphp
                <div class="app-owner-section">
                    <div class="app-stats">
                        <span><strong>{{ $pending->count() }}</strong> pending</span>
                        <span><strong>{{ $approvedCount }}</strong> approved</span>
                        <span><strong>{{ $refusedCount }}</strong> refused</span>
                    </div>
                    <div class="app-owner-actions">
                        <a href="/group/{{ $post->id }}" class="app-btn app-btn-secondary">Go to group</a>
                        @if($pending->count() > 0)
                            <button type="button" class="app-btn app-btn-primary" onclick="openApplications()">View applicants</button>
                        @endif
                    </div>
                    @if($pending->count() == 0)
                        <p class="app-empty">No pending applicants right now.</p>
                    @endif
                </div>

                <div class="applications-panel d-none">
                    <div class="applications-panel-inner">
                        <button type="button" class="app-back" onclick="closeApplications()" aria-label="Back"><i class="fa-solid fa-arrow-rotate-left"></i></button>
                        <h2>Applicants ({{ $pending->count() }})</h2>

                        <form class="applicants-form" action="{{ route('handle_applications', ['id' => $post->id]) }}" method="POST">
                            @csrf
                            <div class="applicants-list">
                                @foreach($pending as $application)
                                    <label class="applicant-row">
                                        <input type="checkbox" class="applicant-checkbox" name="check[]" value="{{ $application->from_user_id }}">
                                        <a class="applicant-name" data-user-id="{{ $application->from_user_id }}">{{ $application->user->name }}</a>
                                    </label>
                                @endforeach
                            </div>
                            <div class="applicants-actions">
                                <button class="app-btn app-btn-approve" name="approve"><i class="fa-solid fa-check"></i> Approve</button>
                                <button class="app-btn app-btn-refuse" name="refuse"><i class="fa-solid fa-xmark"></i> Refuse</button>
                            </div>
                        </form>

                        <div class="applicant-detail d-none">
                            <button type="button" class="app-back back-to-applicants" aria-label="Back to list"><i class="fa-solid fa-arrow-rotate-left"></i></button>
                            <img class="applicant-detail-avatar" src="../assets/images/user.png" alt="user">
                            <h3 class="applicant-detail-name"></h3>
                            <p class="applicant-detail-bio"></p>
                            <a class="applicant-detail-cv d-none" href="#" target="_blank" rel="noopener">View CV</a>
                        </div>
                    </div>
                </div>
            @endunless
        </div>
    </div>

    <script src="../assets/js/applications.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
</x-app-layout>
