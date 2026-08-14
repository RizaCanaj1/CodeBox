<?php

namespace App\Http\Controllers;

use App\Models\BugHunterProgress;
use App\Models\BugHunterSubmission;
use App\Models\Teachers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BugHunterController extends Controller
{
    // Every language x difficulty pair currently playable — kept in sync
    // with PROJECTS/DIFFICULTY_SETTINGS in bug_hunter.js by hand for now,
    // there's no shared source of truth between PHP and JS yet. Used only
    // to compute "have you cleared everything" for the Bug Finisher badge.
    const LANGUAGES = ['javascript', 'node', 'python', 'php', 'cpp', 'csharp', 'java'];
    const DIFFICULTIES = ['easy', 'medium', 'hard'];

    // A submission gets deleted outright once it collects this many reports
    // — no review queue, the community moderates it (per explicit request:
    // uploads go live immediately, reports are what take them back down).
    const REPORT_DELETE_THRESHOLD = 5;

    public function progress()
    {
        $completed = BugHunterProgress::where('user_id', Auth::id())
            ->get(['language', 'difficulty', 'best_score'])
            ->map(fn ($row) => [
                'language' => $row->language,
                'difficulty' => $row->difficulty,
                'best_score' => $row->best_score,
            ]);

        return response()->json([
            'completed' => $completed,
            'total_combos' => count(self::LANGUAGES) * count(self::DIFFICULTIES),
        ]);
    }

    // Idempotent on purpose — replaying an already-cleared combo updates
    // best_score but never counts as a second "clear", which is the whole
    // point (no unlimited badge/completion farming off one mode).
    public function complete(Request $request)
    {
        $data = $request->validate([
            'language' => 'required|string|in:' . implode(',', self::LANGUAGES),
            'difficulty' => 'required|string|in:' . implode(',', self::DIFFICULTIES),
            'score' => 'required|integer|min:0',
        ]);

        $progress = BugHunterProgress::firstOrNew([
            'user_id' => Auth::id(),
            'language' => $data['language'],
            'difficulty' => $data['difficulty'],
        ]);
        $isFirstClear = !$progress->exists;
        $progress->best_score = max($progress->best_score ?? 0, $data['score']);
        $progress->completed_at = $progress->completed_at ?? now();
        $progress->save();

        $totalCompleted = BugHunterProgress::where('user_id', Auth::id())->count();
        $totalCombos = count(self::LANGUAGES) * count(self::DIFFICULTIES);

        return response()->json([
            'first_clear' => $isFirstClear,
            'total_completed' => $totalCompleted,
            'total_combos' => $totalCombos,
            'all_completed' => $totalCompleted >= $totalCombos,
        ]);
    }

    // The courses *this* user teaches — powers the optional "restrict to my
    // course" dropdown on the upload form. Empty for non-teachers, which
    // the frontend uses to hide that dropdown entirely.
    public function myCourses()
    {
        $teacher = Teachers::where('user_id', Auth::id())->first();
        $courses = $teacher ? $teacher->courses()->get(['id', 'name']) : collect();

        return response()->json(['courses' => $courses]);
    }

    // Goes live immediately — no review queue. The abuse warning shown on
    // the form plus the report-to-delete flow below are the moderation
    // mechanism now, not a pending/approved gate.
    public function submitChallenge(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:100',
            'language' => 'required|string|max:50',
            'course_id' => 'nullable|integer|exists:courses,id',
            'bugged_code' => 'required|string|max:20000',
            'fixed_code' => 'required|string|max:20000',
        ]);

        if (!empty($data['course_id'])) {
            $teacher = Teachers::where('user_id', Auth::id())->first();
            $ownsCourse = $teacher && $teacher->courses()->where('id', $data['course_id'])->exists();
            if (!$ownsCourse) {
                return response()->json(['message' => "You can only restrict a puzzle to a course you teach."], 403);
            }
        }

        BugHunterSubmission::create([
            'user_id' => Auth::id(),
            'title' => $data['title'],
            'language' => $data['language'],
            'course_id' => $data['course_id'] ?? null,
            'bugged_code' => $data['bugged_code'],
            'fixed_code' => $data['fixed_code'],
            'status' => 'approved',
        ]);

        return response()->json(['message' => "Published! Anyone with the ID can play it." . (!empty($data['course_id']) ? " Restricted to your course." : "")]);
    }

    public function submissions()
    {
        $submissions = BugHunterSubmission::where('status', 'approved')
            ->with(['user:id,name', 'course:id,name'])
            ->latest()
            ->limit(50)
            ->get(['id', 'title', 'language', 'user_id', 'course_id', 'report_count', 'created_at']);

        return response()->json(['submissions' => $submissions]);
    }

    // Fetches one submission's code. NOTE on course_id: this only verifies
    // the requester IS the course's teacher — there is no student
    // enrollment/purchase table anywhere in this app yet, so a course-
    // restricted puzzle can't actually be limited to paying students until
    // that exists. Flagged here rather than silently pretending this is
    // real access control.
    public function puzzle($id)
    {
        $submission = BugHunterSubmission::where('status', 'approved')->find($id);
        if (!$submission) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($submission->course_id) {
            $teacher = Teachers::where('user_id', Auth::id())->first();
            $isOwner = $submission->user_id === Auth::id();
            $isCourseTeacher = $teacher && $teacher->courses()->where('id', $submission->course_id)->exists();
            if (!$isOwner && !$isCourseTeacher) {
                return response()->json(['message' => 'This puzzle is restricted to its course.'], 403);
            }
        }

        return response()->json(['submission' => $submission]);
    }

    public function report($id)
    {
        $submission = BugHunterSubmission::find($id);
        if (!$submission) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $submission->increment('report_count');

        if ($submission->report_count >= self::REPORT_DELETE_THRESHOLD) {
            $submission->delete();
            return response()->json(['message' => 'Reported — this one crossed the report threshold and was removed.', 'removed' => true]);
        }

        return response()->json(['message' => 'Reported. Thanks for flagging it.', 'removed' => false]);
    }
}
