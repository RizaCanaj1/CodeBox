<?php

namespace App\Http\Controllers;

use App\Models\Posts;
use App\Models\GroupChat;
use App\Models\GroupRoles;
use App\Models\GroupTodo;
use App\Models\GroupRoleFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupController extends Controller
{
    // Creator or approved applicant. Shared by every endpoint below instead
    // of each repeating the same PostInvitations lookup.
    private function authorizeMember($groupId): Posts
    {
        $post = Posts::findOrFail($groupId);
        if (!$post->isAccessibleBy(auth()->id())) {
            abort(403, 'You are not a member of this group');
        }
        return $post;
    }

    // Role management (create/edit/delete, assigning roles to members) stays
    // creator-only — only file access/management is delegable via roles.
    private function authorizeCreator($groupId): Posts
    {
        $post = Posts::findOrFail($groupId);
        if ($post->user_id != auth()->id()) {
            abort(403, 'You are not allowed to manage roles for this group');
        }
        return $post;
    }

    public function get_group_chat($group_id)
    {
        $this->authorizeMember($group_id);
        $chat = GroupChat::where('group_id', $group_id)->orderBy('created_at')->get();
        return response()->json($chat);
    }

    public function send_group_message(Request $request, $group_id)
    {
        $this->authorizeMember($group_id);
        $request->validate(['content' => 'required|string']);

        $message = GroupChat::create([
            'group_id' => $group_id,
            'from_user_id' => auth()->id(),
            'content' => $request->input('content'),
        ]);
        if (!$message) {
            return response()->json(['message' => 'Error creating message'], 500);
        }

        return response()->json($message);
    }

    public function add_group_role(Request $request, $id)
    {
        $this->authorizeCreator($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'can_manage_files' => 'boolean',
            'folders' => 'array',
            'folders.*' => 'string|max:255',
        ]);

        $role = GroupRoles::create([
            'group_id' => $id,
            'name' => $request->input('name'),
            'from_user_id' => auth()->id(),
            'can_manage_files' => $request->boolean('can_manage_files'),
        ]);

        foreach (array_unique($request->input('folders', [])) as $folder) {
            GroupRoleFolder::create([
                'group_role_id' => $role->id,
                'folder_name' => $folder,
            ]);
        }

        return response()->json($role->load('folders'));
    }

    public function update_group_role(Request $request, $groupId, $roleId)
    {
        $this->authorizeCreator($groupId);
        $role = GroupRoles::where('group_id', $groupId)->findOrFail($roleId);

        $request->validate([
            'name' => 'required|string|max:100',
            'can_manage_files' => 'boolean',
            'folders' => 'array',
            'folders.*' => 'string|max:255',
        ]);

        $role->update([
            'name' => $request->input('name'),
            'can_manage_files' => $request->boolean('can_manage_files'),
        ]);

        $role->folders()->delete();
        foreach (array_unique($request->input('folders', [])) as $folder) {
            GroupRoleFolder::create([
                'group_role_id' => $role->id,
                'folder_name' => $folder,
            ]);
        }

        return response()->json($role->load('folders'));
    }

    public function delete_group_role($groupId, $roleId)
    {
        $this->authorizeCreator($groupId);
        $role = GroupRoles::where('group_id', $groupId)->findOrFail($roleId);
        $role->delete();

        return response()->json(['message' => 'Role deleted']);
    }

    // Replaces (not adds to) a member's roles for this group — unchecking a
    // role in the UI actually removes it, since this always syncs to
    // exactly the submitted set.
    public function set_member_roles(Request $request, $groupId, $userId)
    {
        $this->authorizeCreator($groupId);

        $request->validate([
            'role_ids' => 'array',
            'role_ids.*' => 'integer',
        ]);

        $groupRoleIds = GroupRoles::where('group_id', $groupId)->pluck('id');
        $requestedIds = collect($request->input('role_ids', []))->intersect($groupRoleIds)->values();

        DB::table('group_role_user')
            ->where('user_id', $userId)
            ->whereIn('group_role_id', $groupRoleIds)
            ->delete();

        $now = now();
        $rows = $requestedIds->map(fn ($roleId) => [
            'group_role_id' => $roleId,
            'user_id' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();
        if ($rows) {
            DB::table('group_role_user')->insert($rows);
        }

        return response()->json(['role_ids' => $requestedIds]);
    }

    public function get_group_todos($groupId)
    {
        $this->authorizeMember($groupId);

        $todos = GroupTodo::where('group_id', $groupId)
            ->with(['creator:id,name', 'assignee:id,name'])
            ->orderBy('is_done')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($todos);
    }

    public function store_group_todo(Request $request, $groupId)
    {
        $post = $this->authorizeMember($groupId);

        $request->validate([
            'title' => 'required|string|max:255',
            'assigned_to' => 'nullable|integer',
        ]);

        $assignedTo = $request->input('assigned_to');
        if ($assignedTo && !$post->isAccessibleBy($assignedTo)) {
            return response()->json(['message' => 'That user is not a member of this group'], 422);
        }

        $todo = GroupTodo::create([
            'group_id' => $groupId,
            'title' => $request->input('title'),
            'created_by' => auth()->id(),
            'assigned_to' => $assignedTo,
        ]);

        return response()->json($todo->load(['creator:id,name', 'assignee:id,name']));
    }

    // Assignee or group creator — shared by update/toggle/delete below.
    private function authorizeTodoManager(Posts $post, GroupTodo $todo): void
    {
        if (auth()->id() != $todo->assigned_to && auth()->id() != $post->user_id) {
            abort(403, 'Only the assignee or the group creator can update this task');
        }
    }

    public function update_group_todo(Request $request, $groupId, $todoId)
    {
        $post = $this->authorizeMember($groupId);
        $todo = GroupTodo::where('group_id', $groupId)->findOrFail($todoId);
        $this->authorizeTodoManager($post, $todo);

        $request->validate([
            'title' => 'required|string|max:255',
            'assigned_to' => 'nullable|integer',
        ]);

        $assignedTo = $request->input('assigned_to');
        if ($assignedTo && !$post->isAccessibleBy($assignedTo)) {
            return response()->json(['message' => 'That user is not a member of this group'], 422);
        }

        $todo->update([
            'title' => $request->input('title'),
            'assigned_to' => $assignedTo,
        ]);

        return response()->json($todo->load(['creator:id,name', 'assignee:id,name']));
    }

    public function toggle_group_todo($groupId, $todoId)
    {
        $post = $this->authorizeMember($groupId);
        $todo = GroupTodo::where('group_id', $groupId)->findOrFail($todoId);
        $this->authorizeTodoManager($post, $todo);

        $todo->is_done = !$todo->is_done;
        $todo->save();

        return response()->json($todo);
    }

    public function delete_group_todo($groupId, $todoId)
    {
        $post = $this->authorizeMember($groupId);
        $todo = GroupTodo::where('group_id', $groupId)->findOrFail($todoId);
        $this->authorizeTodoManager($post, $todo);

        $todo->delete();

        return response()->json(['message' => 'Task deleted']);
    }
}
