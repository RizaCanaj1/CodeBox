<?php

namespace App\Http\Controllers;

use ZipArchive;
use App\Models\Posts;
use App\Models\PostCodes;
use App\Models\PostViews;
use App\Models\PostMedias;
use App\Models\PostComments;
use Illuminate\Http\Request;
use App\Models\PostInvitations;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    // 1. unzipFile(): now rejects zip entries that try to traverse out of
    //    the destination folder ("Zip Slip"), and returns false if any
    //    entry is unsafe instead of silently skipping it.
    public function unzipFile($filePath, $destinationPath)
    {
        Storage::makeDirectory($destinationPath);
        $zip = new ZipArchive();

        if ($zip->open($filePath) === TRUE) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);

                if ($filename === false || str_contains($filename, '..') || str_starts_with($filename, '/') || str_starts_with($filename, '\\')) {
                    $zip->close();
                    return false;
                }

                $zip->extractTo($destinationPath, $filename);
            }

            $zip->close();

            return true;
        } else {
            return false;
        }
    }

    public function create_post(Request $request)
    {
        $request->validate([
            //'code'=>'required',
            'type' => ['required', 'string', Rule::in(['invitation', 'showcase', 'question', 'community'])],
            'title' => 'required|string',
            'content' => 'required|string',
            // Job-request fields — only meaningful for invitation posts, and
            // always optional so old posts (created before these columns
            // existed) and skipped fields alike just fall back to
            // "Not defined"/"Free" at display time instead of breaking.
            'programming_languages' => 'nullable|string|max:255',
            'working_hours' => 'nullable|string|max:255',
            'payment' => 'nullable|string|max:255',
            // 7. Restrict uploaded file types/sizes instead of accepting anything.
            // html/htm added — the showcase "Open" live-preview button has
            // always existed specifically for .html files, but this
            // whitelist never actually allowed uploading one.
            'code.*' => 'file|mimes:php,js,ts,py,txt,json,zip,html,htm,css|max:10240',
            'media.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov|max:20480',
        ]);

        // 5. Also exclude 'media' from $data so raw UploadedFile objects
        //    never get passed into Posts::create().
        $data = $request->except(['_token', 'code', 'media']);
        $data['user_id'] = auth()->user()->id;

        // Blank inputs (or fields not shown for this post type) are stored
        // as null rather than empty strings, so the frontend's single
        // "Not defined"/"Free" fallback covers both these and pre-migration
        // posts the same way.
        foreach (['programming_languages', 'working_hours', 'payment'] as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                $data[$field] = null;
            }
        }

        if ($data['type'] == 'question') {
            // 8. Use exact match instead of LIKE (LIKE lets '%' / '_' in a
            //    title act as wildcards and produce false-positive matches).
            //    Also use exists() instead of get()->count() (see #11).
            $same_content = Posts::where('title', '=', $data['title'])
                ->where('type', '=', 'question')
                ->exists();
            if ($same_content) {
                return redirect()->back()->with('status', 'A question with this title already exists');
            }
        }

        if ($newPost = Posts::create($data)) {
            if ($request->hasFile('code') && $data['type'] == 'showcase') {
                $destinationPath = 'public/codes/';
                foreach ($request->code as $codes) {
                    $file = $codes->getClientOriginalName();
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    $code = $filename . ' - ' . time() . '.' . $ext;
                    Storage::putFileAs($destinationPath, $codes, $code);
                    $codedata = [
                        'post_id' => $newPost->id,
                        'source' => $code
                    ];
                    if (!PostCodes::create($codedata)) {
                        // 13. Clean up the just-uploaded file if the DB write fails,
                        //     so we don't accumulate orphaned files on disk.
                        Storage::delete($destinationPath . $code);
                        return redirect()->back()->with('status', 'Your code file did not upload! Check requirments for uploading your codes');
                    }
                }
            }
            if ($request->hasFile('media') && $data['type'] == 'community') {
                $destinationPath = 'public/media/';
                foreach ($request->media as $medias) {
                    $file = $medias->getClientOriginalName();
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    $media = $filename . ' - ' . time() . '.' . $ext;
                    Storage::putFileAs($destinationPath, $medias, $media);
                    $mediadata = [
                        'post_id' => $newPost->id,
                        'source' => $media
                    ];
                    if (PostMedias::create($mediadata)) {
                    } else {
                        // 13. Same cleanup for the media path.
                        Storage::delete($destinationPath . $media);
                        return redirect()->back()->with('status', 'Your media file did not upload! Check requirments for uploading your medias');
                    }
                }
            }
            if ($data['type'] == 'invitation') {
                // 9. Standardized on the same 'Group/{id}' convention used by
                //    project_code()/get_project()/get_code(), instead of the
                //    old 'Group {id}' (space, no slash) which never matched
                //    the Code lookups elsewhere.
                $folderName = 'Group/' . $newPost->id;
                if (!Storage::makeDirectory($folderName)) {
                    redirect()->back()->with('status', 'Creating the folder for your group has failed!');
                }
                $settings = [
                    'group_id' => $newPost->id,
                    'creator_id' => $data['user_id']
                ];
                $settingsJson = json_encode($settings);
                if (!Storage::put($folderName . '/settings.json', $settingsJson)) {
                    redirect()->back()->with('status', 'Creating settings for your group has failed!');
                }
            }

            return redirect()->route('dashboard')->with('status', 'Post is added');
        }
        return redirect()->back()->with('status', 'Something went wrong!');
    }

    public function edit_comment(Request $request)
    {
        if (isset($request['content']) && isset($request['comment_id'])) {
            $comment_data = PostComments::find($request['comment_id']);
            if (isset($comment_data)) {
                // 6. Authorization check: only the comment's owner can edit it.
                if ($comment_data->user_id !== auth()->id()) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
                $comment_data->content = $request['content'];
                if (!$comment_data->save()) {
                    return response()->json(['message' => 'Failed to edit comment'], 500);
                }
                return response()->json(['message' => 'Comment edited successfully']);
            }
            return response()->json(['message' => 'Comment was not found!']);
        }
        return response()->json(['message' => 'Nothing to be edited on this comment'], 500);
    }

    public function project_code(Request $request)
    {
        $formData = $request->all();
        $groupId = $request->post_id;

        // Was creator-only. Now: creator, or a member with a can_manage_files
        // role — matches whoever's allowed to edit/delete files once the
        // project exists (topFolder=null since there's no folder structure
        // yet to scope this initial upload against).
        $group = Posts::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Your project is not found'], 500);
        }
        if (!$group->canManageFiles(auth()->id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $destinationPath = 'Group/' . $groupId . '/Code';
        $file = $request->file('code');
        $filename = $file->getClientOriginalName();
        if (!Storage::putFileAs($destinationPath, $file, $filename)) {
            return response()->json(['message' => "Failed to upload your code"], 500);
        }
        $zipFilePath = storage_path('app/' . $destinationPath . '/' . $filename);
        $extractedPath = storage_path('app/' . $destinationPath . '/');

        // 2. Check unzipFile()'s return value instead of ignoring it.
        if (!$this->unzipFile($zipFilePath, $extractedPath)) {
            if (file_exists($zipFilePath)) {
                unlink($zipFilePath);
            }
            return response()->json(['message' => 'Failed to extract your code archive'], 500);
        }
        if (file_exists($zipFilePath)) {
            unlink($zipFilePath);
        }
        return response()->json(['message' => 'File uploaded and extracted successfully'], 200);
    }

    // Shared by create_project_folder()/add_project_files(): validates the
    // target folder path (same traversal guard as get_code()/
    // resolveManageableGroupFile()), loads the group, and checks the
    // requester can manage files in it. An empty path means "the Code root"
    // — adding a brand-new top-level folder/file there has no existing
    // folder to scope permission against, so it falls back to "does this
    // user have any manage permission at all" (same as the bootstrap zip
    // upload). Returns [Posts $group, string $storagePath] on success, or a
    // JsonResponse error the caller should return directly.
    private function resolveManageableGroupPath($groupId, $path)
    {
        $path = (string) $path;
        if ($path !== '' && (!preg_match('/^[A-Za-z0-9_\-\/\.]+$/', $path) || str_contains($path, '..'))) {
            return response()->json(['message' => 'Invalid path'], 422);
        }

        $group = Posts::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Your project is not found'], 404);
        }

        $topFolder = $path !== '' ? (explode('/', ltrim($path, '/'))[0] ?? null) : null;
        if (!$group->canManageFiles(auth()->id(), $topFolder)) {
            return response()->json(['message' => 'You do not have permission to manage this folder'], 403);
        }

        return [$group, 'Group/' . $groupId . '/Code' . $path];
    }

    public function create_project_folder(Request $request)
    {
        $request->validate([
            'group_id' => 'required',
            'path' => 'nullable|string',
            'name' => ['required', 'string', 'max:255', 'regex:/^[A-Za-z0-9_\-. ]+$/'],
        ]);

        if (str_contains($request->input('name'), '..')) {
            return response()->json(['message' => 'Invalid folder name'], 422);
        }

        $resolved = $this->resolveManageableGroupPath($request->group_id, $request->input('path', ''));
        if ($resolved instanceof \Illuminate\Http\JsonResponse) {
            return $resolved;
        }
        [, $storagePath] = $resolved;

        $targetPath = $storagePath . '/' . $request->input('name');
        if (Storage::exists($targetPath) || Storage::directoryExists($targetPath)) {
            return response()->json(['message' => 'A file or folder with that name already exists'], 422);
        }
        if (!Storage::makeDirectory($targetPath)) {
            return response()->json(['message' => 'Failed to create folder'], 500);
        }

        return response()->json(['message' => 'Folder created']);
    }

    public function add_project_files(Request $request)
    {
        $request->validate([
            'group_id' => 'required',
            'path' => 'nullable|string',
            'files' => 'required|array|min:1',
            'files.*' => 'file|mimes:php,js,ts,py,txt,json,html,css,md,xml,yml,yaml,jpg,jpeg,png,gif,webp,svg|max:10240',
        ]);

        $resolved = $this->resolveManageableGroupPath($request->group_id, $request->input('path', ''));
        if ($resolved instanceof \Illuminate\Http\JsonResponse) {
            return $resolved;
        }
        [, $storagePath] = $resolved;

        foreach ($request->file('files') as $file) {
            $filename = $file->getClientOriginalName();
            if (!Storage::putFileAs($storagePath, $file, $filename)) {
                return response()->json(['message' => "Failed to upload {$filename}"], 500);
            }
        }

        return response()->json(['message' => 'Files uploaded']);
    }

    public function get_project($id, $path = '')
    {
        // Only gate/filter on the outer (HTTP-triggered) call — recursive
        // calls for subfolders (see below) reuse the same $id with a
        // non-empty $path and would otherwise repeat this check per folder.
        // The whole tree (every depth) is built and returned in this single
        // response — file_management.js navigates it client-side rather
        // than re-fetching per folder — so filtering the top-level once
        // here is enough to keep a restricted member from ever receiving
        // data about a folder they can't see, at any depth.
        $post = null;
        if ($path === '') {
            $post = Posts::findOrFail($id);
            if (!$post->isAccessibleBy(auth()->id())) {
                return response()->json(['message' => 'You are not a member of this group'], 403);
            }
        }

        $projectFolderPath = storage_path('app/Group/' . $id . '/Code');
        $fullPath = $projectFolderPath . '/' . $path;

        // 3. Resolve real paths and make sure the requested path is still
        //    inside the project folder (blocks '../../etc'-style traversal).
        $realBase = realpath($projectFolderPath);
        $realFull = realpath($fullPath);

        if ($realBase === false || $realFull === false || !str_starts_with($realFull, $realBase)) {
            return ['error' => false];
        }

        $fullPath = $realFull;

        $result = [
            'contents' => [],
            'file_count' => 0,
            'folder_count' => 0
        ];
        $items = scandir($fullPath);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $itemPath = $fullPath . '/' . $item;
            $timestamp = filemtime($itemPath);
            $formattedDate = date('d/m/Y', $timestamp);
            if (is_dir($itemPath)) {
                $directory = $this->get_project($id, ltrim($path . '/' . $item, '/'));
                $result['folder_count'] += 1;

                $result['folder_count'] += $directory['folder_count'];
                if ($directory['file_count'] > 0) {
                    $result['file_count'] += $directory['file_count'];
                }
                $dirInfo = [
                    'type' => 'directory',
                    'last_updated' => $formattedDate
                ];
                $directory['info'] = $dirInfo;
                $result['contents'][$item] = $directory;
            } else {
                $result['file_count']++;
                $fileInfo = [
                    'type' => mime_content_type($itemPath),
                    'size' => filesize($itemPath),
                    'last_updated' => $formattedDate
                ];
                $result['contents'][$item] = ['info' => $fileInfo];
            }
        }

        if ($path === '' && $post !== null) {
            $allowedFolders = $post->allowedFoldersFor(auth()->id());
            if ($allowedFolders !== null) {
                $result['contents'] = array_intersect_key($result['contents'], array_flip($allowedFolders));
                $folderCount = 0;
                $fileCount = 0;
                foreach ($result['contents'] as $entry) {
                    if ($entry['info']['type'] === 'directory') {
                        $folderCount += 1 + $entry['folder_count'];
                        $fileCount += $entry['file_count'];
                    } else {
                        $fileCount++;
                    }
                }
                $result['folder_count'] = $folderCount;
                $result['file_count'] = $fileCount;
            }
        }

        return $result;
    }

    public function get_code(Request $request)
    {
        if (!isset($request->group_id)) {
            return response()->json(['message' => 'There is an error loading files from your project'], 500);
        }

        // 4. Validate file_position before it's concatenated into a storage
        //    path, to block '../'-style traversal. Only allow safe chars.
        $filePosition = (string) $request->file_position;
        if ($filePosition !== '' && (!preg_match('/^[A-Za-z0-9_\-\/\.]+$/', $filePosition) || str_contains($filePosition, '..'))) {
            return response()->json(['message' => 'Invalid file path'], 500);
        }

        $groupPost = Posts::find($request->group_id);
        if (!$groupPost) {
            return response()->json(['message' => 'Your project is not found'], 500);
        }

        // Was creator-only, which blocked the exact people (approved group
        // members) this feature exists for. Now: any member, but still
        // scoped to the folders their roles allow them to see.
        if (!$groupPost->isAccessibleBy(auth()->id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $allowedFolders = $groupPost->allowedFoldersFor(auth()->id());
        if ($allowedFolders !== null) {
            $topFolder = explode('/', ltrim($filePosition, '/'))[0] ?? '';
            if (!in_array($topFolder, $allowedFolders, true)) {
                return response()->json(['message' => 'You do not have access to this folder'], 403);
            }
        }

        $destinationPath = 'Group/' . $request->group_id . '/Code' . $filePosition;
        if (Storage::exists($destinationPath)) {
            $rawContent = Storage::get($destinationPath);
            // Used by the CodeMirror editor (raw source to edit) and the
            // "Open" live-preview button (raw HTML to render) — both need
            // the actual file content, not format_code()'s line-numbered
            // HTML built for the read-only viewer.
            if ($request->boolean('raw')) {
                return response()->json(['code' => $rawContent], 200);
            }
            $formattedCode = $this->format_code($rawContent);
            return response()->json(['code' => $formattedCode], 200);
        }
        return response()->json(['message' => 'Your file is not found'], 500);
    }

    // Raw-content sibling of get_post_code() (which returns format_code()'s
    // line-numbered HTML for the in-page codebox viewer) — used by the
    // "Open" live-preview button for showcase posts, which needs the
    // actual HTML to render in an iframe, not a syntax-highlighted listing.
    public function preview_post_code($file_name)
    {
        if (!preg_match('/^[^\/\\\\]+$/', $file_name) || str_contains($file_name, '..')) {
            return response()->json(['message' => 'Invalid file name'], 422);
        }
        $filePath = 'codes/' . $file_name;
        if (!Storage::disk('public')->exists($filePath)) {
            return response()->json(['message' => "This file doesn't exist"], 404);
        }
        return response()->json(['code' => Storage::disk('public')->get($filePath)]);
    }

    // Shared by update_project_file()/delete_project_file(): same
    // path-traversal guard as get_code(), plus a canManageFiles() check
    // (stricter than get_code()'s view-only isAccessibleBy()). Returns
    // [Posts $group, string $storagePath] on success, or a JsonResponse
    // error the caller should return directly.
    private function resolveManageableGroupFile($groupId, $filePosition)
    {
        $filePosition = (string) $filePosition;
        if ($filePosition === '' || !preg_match('/^[A-Za-z0-9_\-\/\.]+$/', $filePosition) || str_contains($filePosition, '..')) {
            return response()->json(['message' => 'Invalid file path'], 422);
        }

        $group = Posts::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Your project is not found'], 404);
        }

        $topFolder = explode('/', ltrim($filePosition, '/'))[0] ?? '';
        if (!$group->canManageFiles(auth()->id(), $topFolder)) {
            return response()->json(['message' => 'You do not have permission to manage this file'], 403);
        }

        return [$group, 'Group/' . $groupId . '/Code' . $filePosition];
    }

    public function update_project_file(Request $request)
    {
        $request->validate([
            'group_id' => 'required',
            'file_position' => 'required|string',
            'content' => 'required|string',
        ]);

        $resolved = $this->resolveManageableGroupFile($request->group_id, $request->file_position);
        if ($resolved instanceof \Illuminate\Http\JsonResponse) {
            return $resolved;
        }
        [, $storagePath] = $resolved;

        if (!Storage::exists($storagePath)) {
            return response()->json(['message' => 'Your file is not found'], 404);
        }
        if (!Storage::put($storagePath, $request->input('content'))) {
            return response()->json(['message' => 'Failed to save your file'], 500);
        }

        return response()->json(['message' => 'File saved']);
    }

    public function delete_project_file(Request $request)
    {
        $request->validate([
            'group_id' => 'required',
            'file_position' => 'required|string',
        ]);

        $resolved = $this->resolveManageableGroupFile($request->group_id, $request->file_position);
        if ($resolved instanceof \Illuminate\Http\JsonResponse) {
            return $resolved;
        }
        [, $storagePath] = $resolved;

        $isDirectory = Storage::directoryExists($storagePath);
        if (!$isDirectory && !Storage::exists($storagePath)) {
            return response()->json(['message' => 'Your file is not found'], 404);
        }

        $deleted = $isDirectory ? Storage::deleteDirectory($storagePath) : Storage::delete($storagePath);
        if (!$deleted) {
            return response()->json(['message' => 'Failed to delete'], 500);
        }

        return response()->json(['message' => 'Deleted']);
    }

    public function format_code($code)
    {
        $decoded = json_decode($code, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            // If it's valid JSON, pretty-print it
            $code = json_encode($decoded, JSON_PRETTY_PRINT);
        }
        $lines = preg_split('/\r\n|\r|\n/', $code);

        // 10. Removed the pointless batching loop — $lines is already fully
        //     in memory, so chunking it added overhead with no benefit.
        //     Same output, simpler and easier to maintain.
        $formattedLines = [];
        foreach ($lines as $i => $line) {
            $lineNum = $i + 1;
            $formattedLines[] = '<span id="line-' . $lineNum . '"><a>' . $lineNum . '</a>   <span>' . htmlspecialchars($line) . '</span></span><br/>';
        }
        return implode('', $formattedLines);
    }

    public function get_post_code($file_name)
    {
        $filePath = 'codes/' . $file_name;
        if (Storage::disk('public')->exists($filePath)) {
            $code = Storage::disk('public')->get($filePath);
            $formattedLines = $this->format_code($code);
            return response()->json(['code' => $formattedLines], 200);
        }
        return response()->json(['error' => 'Code is not found'], 200);
    }

    public function destroy(string $id)
    {
        // 1. Critical fix: this deleted a User instead of a Post. Now
        //    correctly looks up and deletes the Post matching this route.
        $post = Posts::findOrFail($id);

        // 6. Authorization check: only the post's owner can delete it.
        if ($post->user_id !== auth()->id()) {
            return redirect()->back()->with('status', 'Unauthorized');
        }

        if ($post->delete()) {
            return redirect()->back();
        }
        return redirect()->back();
    }
}