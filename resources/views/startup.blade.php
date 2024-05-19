<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/startup.css"/>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Document</title>
</head>
<body class='bg-light'>
    <p class='hover_message'></p>
    <div class='errors d-flex flex-column gap-3'>
        </div>
    
    <div class='startup-wrapper d-flex flex-column align-items-center'>
        <h2 class='welcome_text'>Welcome to CodeBox</h2>
        <button class='btn_seethrow continue'>Continue to set up your account</button>
        <div class='first_setup'>
            <div class='select-setting d-flex gap-4'>
                <div class='selection all_posts'>
                    <h4>Preferred</h4>
                    <p>Shows all type of posts</p>
                </div>
                <div class='selection interested_on'>
                    <h4>Manualy</h4>
                    <h5>What are you interested in:</h5>
                    <div class='miniselections'>
                        <label class='btn_seethrow miniselection' for="invitations">Invitations</label>
                        <input class="d-none" type="checkbox" id="invitations" name="invitations">
                        <label class='btn_seethrow miniselection' for="showcase">Showcase</label>
                        <input class="d-none" type="checkbox" id="showcase" name="showcase">
                        <label class='btn_seethrow miniselection' for="question">Questions</label>
                        <input class="d-none" type="checkbox" id="question" name="question">
                        <label class='btn_seethrow miniselection' for="community">Community</label>
                        <input class="d-none" type="checkbox" id="community" name="community">
                    </div>
                </div>
            </div>
            <div class='setup_buttons d-flex justify-content-between mt-4'>
                <button class='btn_seethrow back_to_beginning'><-back to beginning</button>
                <button class='btn_seethrow next_setup d-none'>continue-></button>
            </div>
        </div>
        <div class='second_setup'>
            <div class='select-setting d-flex gap-4'>
                <div class='selection update_profile'>
                    <div class='d-flex justify-content-center'>
                        <div>
                            <h4 class='text-center'>Update your profile</h4>
                            <div class="d-flex justify-content-around gap-4">
                                <div  class='d-flex flex-column gap-3 profile-image'>
                                    <button class='btn_seethrow'><h5>Profile image</h5></button>
                                    <img class="ms-3 rounded-circle" src="../assets/images/user.png" alt="User-image">
                                    <label for="profile_photo_path"><div class='profile_hover d-flex justify-content-center align-items-center'><i class="fa-solid fa-upload fa-xl text-white"></i></div></label>
                                    <input class='d-none' type="file" name='profile_photo_path' id='profile_photo_path' accept="image/png, image/jpeg, image/jpg">
                                    <div class='remove_image d-none'><p class='text-center text-white'>x</p></div>
                                </div>
                                
                                <div class='d-flex flex-column gap-3'>
                                    <label for="bio"><button class='btn_seethrow'><h5>Bio:</h5></button></label>
                                    <textarea class='m-auto' name="bio" id="bio"></textarea>
                                    <p class='hidden_textarea opacity-0'></p>
                                    <div class="bio_length"><p><span class='length'>0</span>/<span class='max-length'>255</span></p></div>
                                </div>
                            </div>
                            <h5 class='text-center mt-2'>Socialmedia</h5>
                            <div class="d-flex justify-content-around my-2">
                                <select name="social_media" id="social_media">
                                    <option value="">Social Media</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="LinkedIn">Linkedin</option>
                                    <option value="YouTube">Youtube</option>
                                </select>
                                <div class='d-flex social_input d-none'>
                                    <input type="text" name='prefix' id='prefix' placeholder='prefix' readonly><input type="text" name='social_link' id='social_link'>
                                </div>
                                <button class='add_social btn btn-success d-none'><i class="fa-solid fa-check"></i></button>
                            </div>
                            <div class="added_social d-none d-flex justify-content-center gap-3"></div>
                            <h5 class='text-center mt-2'>CV</h5>
                            <div class="d-flex justify-content-around my-2">
                                <label for="cv">Import CV</label>
                                <input class='d-none' type="file" name='cv' id='cv' accept=".pdf, image/png, image/jpeg, image/jpg">
                            </div>
                        </div>
                        <div class='show_cv d-none p-3 d-flex flex-column justify-content-center'>
                            <div class='d-flex justify-content-center cv_images'>
                                <img class="cv_image" class="ms-3" alt="User-CV">
                            </div>
                            <div class='d-flex gap-4 mt-3 justify-content-center cv_buttons'>
                                <button class="btn btn-primary view_cv">View</button>
                                <button class="btn btn-secondary remove_cv">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class='setup_buttons d-flex justify-content-between mt-4'>
                <button class='btn_seethrow back_to_first'><-back</button>
                <button class='btn_seethrow finish_setup'>Finish-></button>
            </div>
        </div>
        <button class='btn_seethrow text-danger skip'>Skip (set default)</button>
        <div class='skip_setup'>
            <p>Are you sure that you want to skip your setup? <button class='btn_seethrow text-danger skip-confirmation'>Yes</button></p>
            <button class='btn_seethrow dont_skip'>Don't skip</button>
        </div>
        <button class='btn_seethrow text-warning log_out'>Log Out</button>
    </div>
    <div class="focus_cv d-none p-5">
        <div class='d-flex justify-content-center cv_images'>
            <img class="cv_image" class="ms-3" alt="User-CV">
        </div>
        <div class='d-flex gap-4 mt-3 justify-content-center cv_buttons'>
            <button class="btn btn-primary close_focus">Close</button>
            <button class="btn btn-secondary remove_cv">Remove</button>
        </div>
    </div>
    <iframe id='responseFrame' frameborder="0"></iframe>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="assets/js/components/pdf.min.js"></script>
    <script src="assets/js/startup.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</body>
</html>