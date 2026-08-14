<x-app-layout>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/course.css"/>

    <div class="course-shell">
        <div class="course-header">
            <div>
                <h1>Courses</h1>
                <p>Learn from the teachers on CodeBox — browse what's on offer below.</p>
            </div>
            <button type="button" class="btn-add-teacher d-none" onclick="openTeacherForm()"><i class="fa-solid fa-user-plus"></i> Add Teacher</button>
        </div>

        <section class="teachers-section">
            <h2>Teachers</h2>
            <div class="teachers-row"></div>
        </section>

        <section class="courses-section">
            <div class="courses-section-head">
                <h2>Available courses</h2>
                <div class="courses-filter d-none">
                    <span>Showing courses by <strong class="filter-teacher-name"></strong></span>
                    <button type="button" class="clear-filter" onclick="clearTeacherFilter()">Clear filter</button>
                </div>
                <button type="button" class="btn-add-course d-none" onclick="openCourseForm()"><i class="fa-solid fa-plus"></i> Add Course</button>
            </div>
            <div class="courses-grid"></div>
        </section>
    </div>

    <script src="../assets/js/course.js"></script>
    <script src="https://kit.fontawesome.com/51d87a716e.js" crossorigin="anonymous"></script>
</x-app-layout>
