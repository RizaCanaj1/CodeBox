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
            'type' => 'required|string',
            'title' => 'required|string',
            'content' => 'required|string',
            // 7. Restrict uploaded file types/sizes instead of accepting anything.
            'code.*' => 'file|mimes:php,js,ts,py,txt,json,zip|max:10240',
            'media.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov|max:20480',
        ]);

        // 5. Also exclude 'media' from $data so raw UploadedFile objects
        //    never get passed into Posts::create().
        $data = $request->except(['_token', 'code', 'media']);
        $data['user_id'] = auth()->user()->id;

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

        // 6. Authorization check: only the group's creator can upload code to it.
        $group = Posts::find($groupId);
        if (!$group) {
            return response()->json(['message' => 'Your project is not found'], 500);
        }
        if ($group->user_id !== auth()->id()) {
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

    public function get_project($id, $path = '')
    {
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

        // 11. exists() instead of get()->count() != 1 — avoids loading the
        //     row into memory just to count it.
        $group = Posts::where('id', $request->group_id)->exists();
        if (!$group) {
            return response()->json(['message' => 'Your project is not found'], 500);
        }

        // 6. Authorization check: only members/creator of the group can read its code.
        //    (Adjust the ownership check below to match your actual membership model.)
        $groupPost = Posts::find($request->group_id);
        if ($groupPost->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $destinationPath = 'Group/' . $request->group_id . '/Code' . $filePosition;
        if (Storage::exists($destinationPath)) {
            $destinationPath = Storage::get($destinationPath);
            $formattedCode = $this->format_code($destinationPath);
            return response()->json(['code' => $formattedCode], 200);
        }
        return response()->json(['message' => 'Your file is not found'], 500);
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