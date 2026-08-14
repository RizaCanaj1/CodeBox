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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
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

        $fullPath = $path !== '' ? ltrim($path, '/') : null;
        if (!$group->canManageFiles(auth()->id(), $fullPath)) {
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
                $result = $this->filterTreeByAllowedPaths($result, $allowedFolders, '');
            }
        }

        return $result;
    }

    // Prunes $node's tree down to only entries a restricted member can
    // reach: a file/folder is kept whole if its own path is granted
    // (pathCoveredByAny — an ancestor restriction covers everything under
    // it), and a folder that isn't itself granted is still kept — recursed
    // and pruned — if something inside it is (pathHasAllowedDescendant),
    // so e.g. restricting only "Alpha/Sub" still shows "Alpha" in the
    // listing, just pruned down to "Sub". Recomputes folder_count/
    // file_count from what's left, same aggregation the unfiltered build
    // above already does.
    private function filterTreeByAllowedPaths(array $node, array $allowedPaths, string $currentPath): array
    {
        $filtered = [];
        foreach ($node['contents'] as $name => $entry) {
            $childPath = $currentPath === '' ? $name : $currentPath . '/' . $name;
            $isDirectory = $entry['info']['type'] === 'directory';

            if (!$isDirectory) {
                if (Posts::pathCoveredByAny($childPath, $allowedPaths)) {
                    $filtered[$name] = $entry;
                }
                continue;
            }

            if (Posts::pathCoveredByAny($childPath, $allowedPaths)) {
                $filtered[$name] = $entry;
            } elseif (Posts::pathHasAllowedDescendant($childPath, $allowedPaths)) {
                $pruned = $this->filterTreeByAllowedPaths($entry, $allowedPaths, $childPath);
                if (!empty($pruned['contents'])) {
                    $filtered[$name] = $pruned;
                }
            }
        }

        $node['contents'] = $filtered;
        $node['folder_count'] = 0;
        $node['file_count'] = 0;
        foreach ($filtered as $entry) {
            if ($entry['info']['type'] === 'directory') {
                $node['folder_count'] += 1 + $entry['folder_count'];
                $node['file_count'] += $entry['file_count'];
            } else {
                $node['file_count']++;
            }
        }

        return $node;
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
        if ($allowedFolders !== null && !Posts::pathCoveredByAny(ltrim($filePosition, '/'), $allowedFolders)) {
            return response()->json(['message' => 'You do not have access to this folder'], 403);
        }

        $destinationPath = 'Group/' . $request->group_id . '/Code' . $filePosition;
        if (Storage::exists($destinationPath)) {
            $rawContent = Storage::get($destinationPath);
            // Used by the CodeMirror editor (raw source to edit) and the
            // "Open" live-preview button (raw HTML to render) — both need
            // the actual file content, not format_code()'s line-numbered
            // HTML built for the read-only viewer.
            if ($request->boolean('raw')) {
                return response()->json([
                    'code' => $rawContent,
                    // Only meaningful for HTML (the beta-test preview), but
                    // harmless to include unconditionally — CodeMirror's
                    // raw-fetch-for-editing caller just ignores the extra
                    // field.
                    'preview_token' => $this->makePreviewToken((int) $request->group_id, (int) auth()->id()),
                ], 200);
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

    // Signs a short-lived (group_id, user_id, expiry) token for
    // preview_project_asset() below. That endpoint can't use the normal
    // session-cookie auth check like get_code() does: the beta-test preview
    // loads the HTML into a sandboxed `srcdoc` iframe WITHOUT
    // `allow-same-origin` (deliberately — see renderPreview()'s comment in
    // beta-test.js on why), which gives that document an opaque origin.
    // Requests that document itself initiates (its own <link>/<script src>
    // tags fetching sibling CSS/JS) are then treated as cross-site for
    // SameSite cookie purposes and silently sent WITHOUT the session
    // cookie — so a cookie-based auth check on those requests always fails,
    // which is exactly why CSS/JS never loaded before this. A signed token
    // baked into the URL path sidesteps cookies entirely while still
    // enforcing the same access check (re-evaluated fresh at verify time,
    // not just baked into the token, so a role change mid-session still
    // takes effect).
    private function makePreviewToken(int $groupId, int $userId): string
    {
        $expires = time() + 1800;
        $payload = $groupId . '|' . $userId . '|' . $expires;
        $signature = hash_hmac('sha256', $payload, config('app.key'));
        return rtrim(strtr(base64_encode($payload . '|' . $signature), '+/', '-_'), '=');
    }

    // Returns [groupId, userId] on success, null if the token is malformed,
    // tampered with, or expired.
    private function verifyPreviewToken(string $token): ?array
    {
        $decoded = base64_decode(strtr($token, '-_', '+/'), true);
        if ($decoded === false) {
            return null;
        }
        $parts = explode('|', $decoded);
        if (count($parts) !== 4) {
            return null;
        }
        [$groupId, $userId, $expires, $signature] = $parts;
        $payload = $groupId . '|' . $userId . '|' . $expires;
        $expected = hash_hmac('sha256', $payload, config('app.key'));
        if (!hash_equals($expected, $signature) || (int) $expires < time()) {
            return null;
        }
        return [(int) $groupId, (int) $userId];
    }

    // Serves a single raw file (any type — css/js/images/fonts, not just
    // HTML) from a group's project tree with its real Content-Type, so a
    // previewed HTML file's own relative <link>/<script src>/<img> tags
    // resolve correctly against a <base> tag pointing here instead of
    // rendering unstyled/broken. Same view-level access check as get_code()
    // (any member, scoped to the folders their role allows), just
    // re-derived from a signed token instead of the session — see
    // makePreviewToken() above for why.
    public function preview_project_asset($token, $path)
    {
        $verified = $this->verifyPreviewToken((string) $token);
        if (!$verified) {
            abort(403, 'This preview link has expired — reopen the file to refresh it');
        }
        [$group_id, $userId] = $verified;

        $filePosition = '/' . ltrim((string) $path, '/');
        if (!preg_match('/^[A-Za-z0-9_\-\/\.]+$/', $filePosition) || str_contains($filePosition, '..')) {
            abort(422, 'Invalid file path');
        }

        $groupPost = Posts::find($group_id);
        if (!$groupPost || !$groupPost->isAccessibleBy($userId)) {
            abort(403);
        }
        $allowedFolders = $groupPost->allowedFoldersFor($userId);
        if ($allowedFolders !== null && !Posts::pathCoveredByAny(ltrim($filePosition, '/'), $allowedFolders)) {
            abort(403);
        }

        $storagePath = 'Group/' . $group_id . '/Code' . $filePosition;
        if (!Storage::exists($storagePath)) {
            abort(404);
        }

        $mimeTypes = [
            'css' => 'text/css', 'js' => 'application/javascript', 'mjs' => 'application/javascript',
            'json' => 'application/json', 'html' => 'text/html', 'htm' => 'text/html',
            'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif', 'webp' => 'image/webp', 'ico' => 'image/x-icon',
            'woff' => 'font/woff', 'woff2' => 'font/woff2', 'ttf' => 'font/ttf',
        ];
        $ext = strtolower(pathinfo($filePosition, PATHINFO_EXTENSION));
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';

        return response(Storage::get($storagePath), 200)->header('Content-Type', $mime);
    }

    // Extension/mode name -> Piston's language identifier (piston-api.com,
    // a free public code-execution sandbox — running arbitrary
    // user-submitted code ourselves would mean building/maintaining our own
    // container sandbox, well beyond what a single self-hosted app needs).
    private const RUNNABLE_LANGUAGES = [
        'js' => 'javascript', 'javascript' => 'javascript', 'mjs' => 'javascript',
        'py' => 'python', 'python' => 'python',
        'php' => 'php',
        'cpp' => 'c++', 'cc' => 'c++', 'cxx' => 'c++', 'c++' => 'c++',
        'c' => 'c',
        'java' => 'java',
        'cs' => 'csharp', 'csharp' => 'csharp',
    ];

    // Runs a snippet through Piston and returns stdout/stderr — used by the
    // editor's "Run" button. Not tied to a saved project file: the client
    // sends whatever's currently in the buffer (including unsaved edits),
    // same as pressing Run in an online IDE.
    public function run_code(Request $request)
    {
        $request->validate([
            'language' => 'required|string',
            'code' => 'required|string',
            'stdin' => 'nullable|string',
        ]);

        $language = self::RUNNABLE_LANGUAGES[strtolower($request->language)] ?? null;
        if (!$language) {
            return response()->json(['message' => 'Running code is not supported for this file type yet'], 422);
        }

        // Cached — Piston's runtime list rarely changes and this avoids an
        // extra round trip to their API on every single Run click.
        $runtimes = Cache::remember('piston_runtimes', 3600, function () {
            $response = Http::timeout(10)->get('https://emkc.org/api/v2/piston/runtimes');
            return $response->successful() ? $response->json() : [];
        });
        $runtime = collect($runtimes)->firstWhere('language', $language);
        if (!$runtime) {
            return response()->json(['message' => 'The code runner is temporarily unavailable for this language'], 503);
        }

        $response = Http::timeout(15)->post('https://emkc.org/api/v2/piston/execute', [
            'language' => $language,
            'version' => $runtime['version'],
            'files' => [['content' => $request->code]],
            'stdin' => $request->input('stdin', ''),
        ]);
        if (!$response->successful()) {
            return response()->json(['message' => 'Failed to run your code — the runner may be busy, try again shortly'], 502);
        }

        $result = $response->json();
        return response()->json([
            'stdout' => $result['run']['stdout'] ?? '',
            'stderr' => $result['run']['stderr'] ?? '',
            // Compile-stage errors (C/C++/Java/C#) are separate from
            // run-stage stderr — surfaced distinctly so a syntax error
            // doesn't get mistaken for program output on stderr.
            'compile_stderr' => $result['compile']['stderr'] ?? null,
            'exit_code' => $result['run']['code'] ?? null,
        ]);
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

        if (!$group->canManageFiles(auth()->id(), ltrim($filePosition, '/'))) {
            return response()->json(['message' => 'You do not have permission to manage this file'], 403);
        }

        return [$group, 'Group/' . $groupId . '/Code' . $filePosition];
    }

    public function update_project_file(Request $request)
    {
        $request->validate([
            'group_id' => 'required',
            'file_position' => 'required|string',
            // 'present' (not 'required') so an empty string is a valid
            // value — otherwise a brand-new blank file, or clearing an
            // existing file down to zero bytes, would fail validation.
            'content' => 'present|string',
        ]);

        $resolved = $this->resolveManageableGroupFile($request->group_id, $request->file_position);
        if ($resolved instanceof \Illuminate\Http\JsonResponse) {
            return $resolved;
        }
        [, $storagePath] = $resolved;

        // Upsert — Storage::put() already creates-or-overwrites, so this
        // covers a normal save (existing file), "Save As" (writing the
        // edited content to a brand new path the user just picked), and
        // creating a brand-new blank file from the sidebar's "New file"
        // button. Permission is still fully checked above, scoped to the
        // target path's own top folder either way.
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

    // Zips one or more files/folders from a group's Code/ tree and streams
    // it back as a download — used for the file browser's per-file download
    // icon (single file, no zip needed there — that path is handled
    // client-side via get-code's raw content instead) as well as the
    // multi-select and "download all" flows, which both funnel into this
    // same endpoint with different path lists. Every path's top folder is
    // independently checked against canDownloadFiles() — the whole request
    // is rejected if any single path isn't permitted, rather than silently
    // zipping only the allowed subset (which would be confusing: "why is
    // this folder missing from my download?").
    public function download_project_files(Request $request)
    {
        $request->validate([
            'group_id' => 'required',
            'paths' => 'required|array|min:1',
            'paths.*' => 'string',
        ]);

        $group = Posts::find($request->group_id);
        if (!$group) {
            return response()->json(['message' => 'Your project is not found'], 404);
        }

        $codePrefix = 'Group/' . $request->group_id . '/Code';
        $entries = [];
        foreach ($request->input('paths') as $path) {
            $path = (string) $path;
            if ($path === '' || !preg_match('/^[A-Za-z0-9_\-\/\.]+$/', $path) || str_contains($path, '..')) {
                return response()->json(['message' => 'Invalid file path'], 422);
            }

            if (!$group->canDownloadFiles(auth()->id(), ltrim($path, '/'))) {
                return response()->json(['message' => 'You do not have permission to download this folder'], 403);
            }

            $storagePath = $codePrefix . $path;
            if (!Storage::exists($storagePath) && !Storage::directoryExists($storagePath)) {
                return response()->json(['message' => "File not found: {$path}"], 404);
            }

            $entries[] = ['path' => $path, 'storagePath' => $storagePath];
        }

        Storage::makeDirectory('tmp');
        $zipPath = storage_path('app/tmp/download_' . uniqid() . '.zip');

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['message' => 'Failed to create zip'], 500);
        }
        foreach ($entries as $entry) {
            if (Storage::directoryExists($entry['storagePath'])) {
                foreach (Storage::allFiles($entry['storagePath']) as $file) {
                    $relative = ltrim(substr($file, strlen($codePrefix)), '/');
                    $zip->addFromString($relative, Storage::get($file));
                }
            } else {
                $relative = ltrim($entry['path'], '/');
                $zip->addFromString($relative, Storage::get($entry['storagePath']));
            }
        }
        $zip->close();

        $safeTitle = preg_replace('/[^A-Za-z0-9_\-]+/', '-', $group->title) ?: 'project';
        return response()->download($zipPath, trim($safeTitle, '-') . '.zip')->deleteFileAfterSend(true);
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