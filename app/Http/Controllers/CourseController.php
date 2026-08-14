<?php

namespace App\Http\Controllers;

use App\Models\Courses;
use App\Models\Teachers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    // Promoting a user to teacher stays admin-only — once promoted, the
    // teacher self-manages their own courses (see resolveTeacherIdForCreate/
    // authorizeCourseOwner below). Also assigns the 'teacher' Spatie role
    // (already seeded in database/seeders/Roles.php, just never assigned
    // anywhere) so the frontend can badge/gate on it via get_role.
    public function add_teacher(Request $request)
    {
        if (!Auth::user()->hasRole('admin')) {
            return response()->json(['error' => 'You are not allowed to add teachers'], 403);
        }

        $data = $request->validate([
            'user_id' => 'nullable|integer|exists:users,id',
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'profile_photo_path' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('profile_photo_path')) {
            $data['profile_photo_path'] = $request->file('profile_photo_path')->store('teachers', 'public');
        }

        $teacher = Teachers::create($data);
        if (!$teacher) {
            return response()->json(['error' => 'Error adding Teacher'], 500);
        }

        if ($teacher->user_id) {
            $user = User::find($teacher->user_id);
            if ($user && !$user->hasRole('teacher')) {
                $user->assignRole('teacher');
            }
        }

        return response()->json($teacher);
    }

    // Admin manages any course; a teacher manages only their own. Used by
    // update_course()/delete_course().
    private function authorizeCourseOwner(Courses $course): void
    {
        if (Auth::user()->hasRole('admin')) {
            return;
        }
        $teacher = Teachers::where('user_id', Auth::id())->first();
        if (!$teacher || $teacher->id !== $course->teacher_id) {
            abort(403, 'You are not allowed to manage this course');
        }
    }

    // Admin may create a course under any teacher_id they submit; anyone
    // else must already be a teacher, and always gets their OWN teacher_id
    // regardless of what was submitted — prevents a teacher from creating
    // courses under someone else's name.
    private function resolveTeacherIdForCreate(?int $submittedTeacherId): int
    {
        if (Auth::user()->hasRole('admin') && $submittedTeacherId) {
            return $submittedTeacherId;
        }
        $teacher = Teachers::where('user_id', Auth::id())->first();
        if (!$teacher) {
            abort(403, 'You must be a teacher to add a course');
        }
        return $teacher->id;
    }

    public function add_course(Request $request)
    {
        $data = $request->validate([
            'teacher_id' => 'nullable|integer|exists:teachers,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:4000',
            'price' => 'nullable|numeric|min:0|max:100000',
            'languages' => 'nullable|string|max:255',
            'total_hours' => 'nullable|integer|min:0|max:10000',
            'schedule_days' => 'nullable|string|max:255',
            'schedule_time' => 'nullable|string|max:255',
            'profile_photo_path' => 'nullable|image|max:5120',
        ]);

        $data['teacher_id'] = $this->resolveTeacherIdForCreate($data['teacher_id'] ?? null);

        if ($request->hasFile('profile_photo_path')) {
            $data['profile_photo_path'] = $request->file('profile_photo_path')->store('courses', 'public');
        }

        $course = Courses::create($data);
        if (!$course) {
            return response()->json(['error' => 'Error adding Course'], 500);
        }

        return response()->json($course->load('teacher'));
    }

    public function update_course(Request $request, $id)
    {
        $course = Courses::findOrFail($id);
        $this->authorizeCourseOwner($course);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:4000',
            'price' => 'nullable|numeric|min:0|max:100000',
            'languages' => 'nullable|string|max:255',
            'total_hours' => 'nullable|integer|min:0|max:10000',
            'schedule_days' => 'nullable|string|max:255',
            'schedule_time' => 'nullable|string|max:255',
        ]);

        $course->update($data);
        return response()->json($course->load('teacher'));
    }

    public function delete_course($id)
    {
        $course = Courses::findOrFail($id);
        $this->authorizeCourseOwner($course);
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }

    public function get_courses()
    {
        return response()->json(Courses::with('teacher:id,name,user_id,profile_photo_path')->orderByDesc('id')->get());
    }

    public function get_teachers()
    {
        $teachers = Teachers::get();
        return response()->json($teachers);
    }

    public function get_not_teachers()
    {
        $users = User::leftJoin('teachers', 'users.id', '=', 'teachers.user_id')->whereNull('teachers.user_id')->select('users.id', 'users.name')->get();
        return response()->json($users);
    }
}
