<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserMedia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class StartupController extends Controller
{
    // Frontend sends files as `data:<mime>;base64,<data>` strings (see
    // image_convertor() in startup.js — it reads the picked file with
    // FileReader.readAsDataURL so it can preview it before the user
    // finishes setup, rather than a multipart upload), not real uploaded
    // files. Decodes one of those and saves it under
    // public/storage/<folder>, returning the relative path to store on
    // the user record — or null if nothing was sent.
    private function saveBase64File(?string $dataUri, string $folder, array $allowedExtensions)
    {
        if (!$dataUri) {
            return null;
        }

        if (!preg_match('#^data:([\w/\-\.]+);base64,#i', $dataUri, $matches)) {
            throw new \InvalidArgumentException('Unrecognized file data');
        }

        $mime = $matches[1];
        $extension = match (true) {
            str_contains($mime, 'png') => 'png',
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => 'jpg',
            str_contains($mime, 'pdf') => 'pdf',
            default => null,
        };
        if (!$extension || !in_array($extension, $allowedExtensions, true)) {
            throw new \InvalidArgumentException('Unsupported file type');
        }

        $data = base64_decode(preg_replace('#^data:[\w/\-\.]+;base64,#i', '', $dataUri));

        // Was `File::exists('profile-photos')` / `File::makeDirectory('profile-photos')`
        // — a relative path with no public_path() wrapper, and missing the
        // storage/ prefix the file itself was actually written under. It
        // happened to never block anything only because the real target
        // directory already existed for unrelated reasons.
        $directory = public_path('storage/' . $folder);
        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $filename = Str::random(30) . '.' . $extension;
        if (!File::put($directory . '/' . $filename, $data)) {
            throw new \RuntimeException("Failed to save {$folder} file");
        }

        return $folder . '/' . $filename;
    }

    public function upload_user(Request $request)
    {
        $user = User::find(Auth::id());
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        try {
            $user->bio = $request->input('bio', '');

            $profilePath = $this->saveBase64File($request->input('profile_image'), 'profile-photos', ['png', 'jpg']);
            if ($profilePath) {
                $user->profile_photo_path = $profilePath;
            }

            // CV was silently lost before this — the frontend built the
            // whole payload with JSON.stringify(), and a raw File object
            // serializes to `{}` under JSON.stringify, so nothing about it
            // ever actually reached the server (see the fix in
            // startup.js's finish_setup handler, which now base64-encodes
            // it the same way the profile image already was).
            $cvPath = $this->saveBase64File($request->input('cv'), 'cvs', ['png', 'jpg', 'pdf']);
            if ($cvPath) {
                $user->cv_path = $cvPath;
            }

            // Was read by the frontend (post_type / selected_checkbox) but
            // never read here at all, so the preference picked in step 1
            // was silently thrown away.
            $postTypes = $request->input('post_type', ['all']);
            $user->preferred_post_types = json_encode(is_array($postTypes) && count($postTypes) ? $postTypes : ['all']);

            foreach ($request->input('social_media', []) as $media) {
                if (empty($media['social_name']) || empty($media['social_link'])) {
                    continue;
                }
                UserMedia::create([
                    'user_id' => $user->id,
                    'social_media' => $media['social_name'],
                    'media_link' => $media['social_link'],
                ]);
            }

            $user->assignRole('programmer');
            $user->save();

            // This used to fall through with no return at all on success,
            // so the frontend never got a real response back — it just
            // saw an empty body and quietly did nothing.
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            // Was `dd($e)` — dumps the exception and halts the response
            // entirely, so the frontend never got JSON back here either,
            // just a raw debug dump (which is exactly what
            // startup.js's #responseFrame fallback exists to catch).
            Log::error('Startup upload_user failed: ' . $e->getMessage());
            return response()->json(['error' => 'Something went wrong saving your setup. Please try again.'], 500);
        }
    }
}
