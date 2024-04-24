<x-app-layout>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/course.css"/>
    <div class='m-5'>
        <h3>Teachers</h3>
        <div class='twrapper'>
            <div class='teachers' data-quantity='0'></div>
            <div class='d-none add_teacher_button'>
                <button class='btn btn-outline-primary btn-add-t'>Add Teacher</button>
            </div>
        </div>
    </div>
    
    <div class='d-none form_add_teacher'>
        <form class='add_teacher' action='{{route("add_teacher")}}' method='POST'>
            @csrf
            <div class='m-4 d-flex flex-column gap-2 '>
                <div class='d-flex gap-2'>
                    <select name="user" id="user">
                        <option value="none" data-name='none'>Select User (Create new)</option>
                    </select>
                    <input type="number" id='id' name='user_id' min='0' placeholder='ID (not required)'>
                    <input type="text" id='name' name='name' placeholder='Name' required >
                    <input type="file" id='profile' name='profile_photo_path' placeholder='Profile Picture'>
                    
                </div>
                <div class='d-flex gap-5 align-items-center'>
                    <textarea name="bio" id="bio" placeholder='Bio' cols="50"  rows="5"></textarea>
                    <button class='btn btn-outline-primary add'>Add Teacher</button>
                </div>
            </div>
        </form>
    </div>
    <div class='m-5'>
        <h3>Courses:</h3>
        <div class='cwrapper'>
            <div class='courses' data-quantity='0'></div>
            <div class='d-none add_course_button'>
                <button class='btn btn-outline-primary btn-add-c'>Add Course</button>
            </div>
        </div>
    </div>
    
    <div class='d-none form_add_course'>
        <form class='add_course' action='{{route("add_course")}}' method='POST'>
            @csrf
            <div class='m-4 d-flex flex-column gap-2 '>
                <div class='d-flex gap-2'>
                    <select name="teacher" id="teacher">
                        <option value="none" data-name='none'>Select Teacher</option>
                    </select>
                    <input type="number" id='id' name='teacher_id' min='0' placeholder='Select from Id' required>
                    <input type="text" id='name' name='name' placeholder='Course Name' required >
                    <input type="file" id='picture' name='profile_photo_path' placeholder='Course Picture'>
                </div>
                <div class='d-flex gap-5 align-items-center'>
                    <textarea name="description" id="description" placeholder='Course Description' cols="50" rows="5"></textarea>
                    <input type="number" id='price' name='price' min='5' max='1000' placeholder='Price'>
                    <button class='btn btn-outline-primary add'>Add Course</button>
                </div>
                <h4>Features:</h4>
                    
                <div class='d-flex gap-5 align-items-center'>
                    <label for="payment_only">Only payment:</label>
                    <input type="checkbox" id='payment_only' name='payment_only'>
                    <label for="chat">Chat:</label>
                    <input type="checkbox" id='chat' name='chat'>
                    <input type="url" id='link' name='link' placeholder='Link to course' required >
                    <label for="meetings">Meetings:</label>
                    <input type="checkbox" id='meetings' name='meetings'>
                </div>
                <div class='d-flex gap-5 align-items-center'>
                    <label for="students_database">Students-database:</label>
                    <input type="checkbox" id='students_database' name='students_database'>
                </div>
            </div>
        </form>
    </div>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="assets/js/course.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</x-app-layout>
