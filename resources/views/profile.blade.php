<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/profile.css"/>
    <link rel="stylesheet" href="../assets/css/components/post.css"/>
       
    <body class="font-sans antialiased">
    <div class='container'>
        <div class='mt-5'>
            <div class='profile-bar'>
                <div>
                    <img class="profile-image rounded-circle" src="../assets/images/user.png" alt="User-image">
                </div>
                <div>
                    <div class='d-flex w-100 justify-content-between'>
                        <h1 class='profile-name'>Profile-name</h1>
                        <button class="btn-add d-none opacity-0">Add Friend</button>
                        <button class="btn-edit d-none opacity-0">Edit</button>
                    </div>
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
                <div class='m-info'>
                    <h1>Contacts:</h1>
                    <div class='d-flex gap-2 my-2'>
                        <div class='contacts d-flex gap-2'>
                            <span class='removable-icons' id='facebook-icon'><a href="https://www.facebook.com/" id='facebook-link'><i class="fa-brands fa-facebook fa-2x facebook-icon"></i></a><span class='remove-btn d-none'></span></span>
                            <span class='removable-icons' id='instagram-icon'><a href="https://www.instagram.com/" id='instagram-link'><i class="fa-brands fa-instagram fa-2x instagram-icon"></i></a><span class='remove-btn d-none'></span></span>
                            <span class='removable-icons' id='linkedin-icon'><a href="https://www.linkedin.com/" id='linkedin-link'><i class="fa-brands fa-linkedin fa-2x linkedin-icon"></i></a><span class='remove-btn d-none'></span></span>
                        </div>
                        <i class='fa-solid fa-plus fa-xl add-icon d-none'></i>
                    </div>
                    
                    <div class='d-flex gap-3 new-social d-none'>
                        <select name="social" id="social">
                            <option value="">Social Media</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Facebook">Facebook</option>
                            <option value="LinkedIn">Linkedin</option>
                            <option value="YouTube">Youtube</option>
                        </select>
                        <input type="text" name="link" id="link" placeholder="Social-Media-Link">
                        <button class='add_social btn btn-success d-none'><i class="fa-solid fa-check"></i></button>
                    </div>
                    <h1>Bio:</h1>
                    <h6 class='bio'>I'm a Full-stack Developer. Front: React Js, Backend: Laravel. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Odio voluptatem iste dicta, veniam molestiae quam nesciunt consectetur laborum. Culpa, exercitationem. Incidunt ducimus libero, sed architecto at doloribus pariatur magnam ex.</h6>
                    <textarea class='d-none' name="bio" id="bio" cols="50" rows="10" readonly></textarea>
                    <button class='save_changes btn btn-outline-success d-none'>Save</button>
                    <button class='discard_changes btn btn-outline-danger d-none'>Discard</button>
                </div>
            </div>
            <br>
            <div class='post-selector'>
                <div class='d-flex justify-content-between p-selector'>
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
    <script src="assets/js/components/post.js"></script>
    <script src="assets/js/components/code_box.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>

    