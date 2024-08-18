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

class PostController extends Controller
{   
    public function unzipFile($filePath, $destinationPath)
    {
        Storage::makeDirectory($destinationPath);
        $zip = new ZipArchive();

        if ($zip->open($filePath) === TRUE) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);

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
            'content' => 'required|string'
        ]);
        $data = $request->except(['_token', 'code']);
        $data['user_id'] = auth()->user()->id;
        if($data['type']=='question'){
            $same_content = Posts::where('title','LIKE',$data['title'])->where('type','LIKE','question')->get();
            if($same_content->count() > 0){
                return redirect()->back()->with('status',$same_content);
            }
        }
        if($newPost = Posts::create($data)){
            if($request->hasFile('code') && $data['type']=='showcase'){
                $destinationPath = 'public/codes/';
                foreach($request->code as $codes){
                    $file = $codes->getClientOriginalName();
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    $code = $filename .' - ' .time() .'.'.$ext;
                    Storage::putFileAs($destinationPath, $codes, $code);
                    $codedata=[
                        'post_id'=>$newPost->id,
                        'source'=>$code
                    ];
                    if(!PostCodes::create($codedata)){
                        return redirect()->back()->with('status', 'Your code file did not upload! Check requirments for uploading your codes');
                    }
                }
            }
            if($request->hasFile('media') && $data['type']=='community'){
                $destinationPath = 'public/media/';
                foreach($request->media as $medias){
                    $file = $medias->getClientOriginalName();
                    $filename = pathinfo($file, PATHINFO_FILENAME);
                    $ext = pathinfo($file, PATHINFO_EXTENSION);
                    $media = $filename .' - ' .time() .'.'.$ext;
                    Storage::putFileAs($destinationPath, $medias, $media);
                    $mediadata=[
                        'post_id'=>$newPost->id,
                        'source'=>$media
                    ];
                    if(PostMedias::create($mediadata)){}
                    else{
                        return redirect()->back()->with('status', 'Your media file did not upload! Check requirments for uploading your medias');
                    }
                }
            }
            if($data['type']=='invitation'){
                $folderName = 'Group '.$newPost->id;
                if(!Storage::makeDirectory($folderName)){
                    redirect()->back()->with('status', 'Creating the folder for your group has failed!'); 
                }
                $settings = [
                    'group_id' => $newPost->id,
                    'creator_id'=>$data['user_id']
                ];
                $settingsJson = json_encode($settings);
                if(!Storage::put($folderName . '/settings.json', $settingsJson)){
                    redirect()->back()->with('status', 'Creating settings for your group has failed!');
                }
            }
            
            return redirect()->route('dashboard')->with('status', 'Post is added');
        }
        return redirect()->back()->with('status', 'Something went wrong!');
    }
    public function edit_comment(Request $request){
        if(isset($request['content']) && isset($request['comment_id'])){
            $comment_data = PostComments::find($request['comment_id']);
            if(isset($comment_data)){
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
    public function project_code(Request $request)  {
        $formData = $request->all();
        $groupId = $request->post_id;
        $destinationPath = 'Group/' . $groupId . '/Code';
        $file = $request->file('code');
        $filename = $file->getClientOriginalName(); 
        if (!Storage::putFileAs($destinationPath, $file, $filename)) {
            return response()->json(['message' => "Failed to upload your code"], 500);
        }
        $zipFilePath = storage_path('app/' . $destinationPath . '/' . $filename);
        $extractedPath = storage_path('app/' . $destinationPath . '/');
        $this->unzipFile($zipFilePath, $extractedPath);
        if (file_exists($zipFilePath)) {
            unlink($zipFilePath);
        }
        return response()->json(['message' => 'File uploaded and extracted successfully'], 200);
    }
    public function get_project($id, $path = ''){
        $projectFolderPath = storage_path('app/Group/' . $id . '/Code');
        $fullPath = $projectFolderPath . '/' . $path;
        if (!file_exists($fullPath)) {
            return ['error' => false];
        }
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
    public function get_code(Request $request){
        if(!isset($request->group_id)){
            return response()->json(['message' => 'There is an error loading files from your project'], 500);
        }
        $group = Posts::where('id',$request->group_id)->get()->count();
        if($group!=1){
            return response()->json(['message' => 'Your project is not found'], 500);
        }
        $destinationPath = 'Group/' . $request->group_id . '/Code' . $request->file_position;
        if (Storage::exists($destinationPath)) {
            $destinationPath = Storage::get($destinationPath);
            $formattedCode = $this->format_code($destinationPath);
            return response()->json(['code' => $formattedCode], 200);
        }
        return response()->json(['message' => 'Your file is not found'], 500);
    }
    public function format_code ($code) {
        $decoded = json_decode($code, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            // If it's valid JSON, pretty-print it
            $code = json_encode($decoded, JSON_PRETTY_PRINT);
        }
        $lines = preg_split('/\r\n|\r|\n/', $code);
        $formattedLines = [];
        $batchSize = 100; // Process 100 lines at a time
        $totalLines = count($lines);
        $numBatches = ceil($totalLines / $batchSize);
        $index = -1;
        for ($batchIndex = 0; $batchIndex < $numBatches; $batchIndex++) {
            $startIndex = $batchIndex * $batchSize;
            $batchLines = array_slice($lines, $startIndex, $batchSize);

            foreach ($batchLines as $line) {
                $index++;
                $formattedLine ='<span id="line-' . ($startIndex + $index + 1) . '"><a>' . ($startIndex + $index + 1) . '</a>   <span>' . htmlspecialchars($line) . '</span></span><br/>';
                $formattedLines[] = $formattedLine;
            }
        }
        return implode('', $formattedLines);
    }
    public function get_post_code($file_name){
        $filePath = 'codes/'.$file_name;
        if(Storage::disk('public')->exists($filePath)){
            $code = Storage::disk('public')->get($filePath);
            $formattedLines = $this->format_code($code);
            return response()->json(['code' => $formattedLines], 200);
        }
        return response()->json(['error' => 'Code is not found'], 200);
    }
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        if($user->delete()) {
            return redirect()->back();
        }
        return redirect()->back();
    }
} 
