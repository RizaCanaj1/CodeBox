<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/profile.css"/>
       
    <body class="font-sans antialiased">
    <div class='container'>
        <div class='mt-5'>
            <div class='d-flex gap-5'>
                <div>
                    <img class="profile-image rounded-circle" src="../assets/images/user.png" alt="User-image">
                </div>
                <div>
                <h1 class='profile-name'>Profile-name</h1>
                    <h4>Infos:</h4>
                    <div class='p-infos'>
                    <form class='d-flex flex-column gap-2'>
                        <label class='p-3'><input type="radio" class="show-info" value="1" name="show-info" checked/><h5>Projects: 7</h5>
                            <h6>Created 2 | Joined 5</h6>
                        </label>
                        <label class='p-3'><input type="radio" class="show-info" value="2" name="show-info" />
                            <h5>Points: 1210</h5>
                            <h6>Puzzles 150 | Solutions 260 | Projects 800</h6>
                        </label>
                        <label class='p-3'><input type="radio" class="show-info" value="3" name="show-info" />
                            <h5>Rating: 78%</h5>
                            <h6>Review | Positive 39 | Negative 11</h6>
                        </label>
                    </form>
                    </div>
                </div>
                <div>
                    <h1>Contacts:</h1>
                    <div class='contacts d-flex gap-2 my-2'>
                        <i class="fa-brands fa-facebook fa-2x facebook-icon"></i>
                        <i class="fa-brands fa-instagram fa-2x instagram-icon"></i>
                        <i class="fa-brands fa-linkedin fa-2x linkedin-icon"></i>
                    </div>
                    <h1>Bio:</h1>
                    <h6>I'm a Full-stack Developer. Front: React Js, Backend: Laravel</h6>
                </div>
            </div>
            <br>
            <div class='post-selector'>
                <div class='d-flex justify-content-between'>
                    <h3 class='actived'>Showcase</h3>
                    <h3 class='actived'>Invitations</h3>
                    <h3 class='actived'>Questions</h3>
                    <h3 class='actived'>Community</h3>
                </div>
                <hr>
                <div class='posts'>
                    <div class="post m-5 showcase"><p>Showcase Test</p></div>
                    <div class="post m-5 invitations"><p>Invitations Test</p></div>
                    <div class="post m-5 questions"><p>Questions Test</p></div>
                    <div class="post m-5 community"><p>Community Test</p></div>
                </div>
            </div>
        </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="assets/js/profile.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>

    