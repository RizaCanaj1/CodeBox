<?php

namespace App\Http\Controllers;

use App\Models\Friends;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\User;

class ChatController extends Controller
{
    // "Connected" here just means there's a row in `friends` linking the
    // two users in either direction — that table's status/connection
    // columns default to 'no_respond'/'none' and nothing in this codebase
    // ever updates them (no accept/decline flow exists yet), so gating on
    // an "accepted" friendship would make chat unusable for everyone.
    // Sending (or receiving) a friend request is enough to unlock a
    // conversation for now.
    private function isConnected($otherUserId)
    {
        $me = auth()->id();
        return Friends::where(function ($q) use ($me, $otherUserId) {
            $q->where('user_id', $me)->where('from_user_id', $otherUserId);
        })->orWhere(function ($q) use ($me, $otherUserId) {
            $q->where('user_id', $otherUserId)->where('from_user_id', $me);
        })->exists();
    }

    // Everyone you've either exchanged a message with or have a friends
    // connection with, most recent activity first.
    public function conversations()
    {
        $me = auth()->id();

        $messagedIds = Message::where('sender_id', $me)->pluck('receiver_id')
            ->merge(Message::where('receiver_id', $me)->pluck('sender_id'));

        $friendIds = Friends::where('user_id', $me)->pluck('from_user_id')
            ->merge(Friends::where('from_user_id', $me)->pluck('user_id'));

        $otherIds = $messagedIds->merge($friendIds)->unique()->values();

        $conversations = $otherIds->map(function ($otherId) use ($me) {
            $user = User::select('id', 'name', 'profile_photo_path')->find($otherId);
            if (!$user) {
                return null;
            }

            $lastMessage = Message::between($me, $otherId)->latest('created_at')->first();
            $unreadCount = Message::where('sender_id', $otherId)->where('receiver_id', $me)->whereNull('read_at')->count();

            return [
                'user_id' => $user->id,
                'username' => $user->name,
                'profile' => $user->profile_photo_path,
                'last_message' => $lastMessage->content ?? null,
                'last_message_at' => $lastMessage->created_at ?? null,
                'unread_count' => $unreadCount,
            ];
        })->filter()->values();

        $conversations = $conversations->sortByDesc(function ($c) {
            return $c['last_message_at'] ?? '1970-01-01';
        })->values();

        return response()->json($conversations);
    }

    public function messages($otherUserId)
    {
        if (!$this->isConnected($otherUserId)) {
            return response()->json(['error' => 'You are not connected with this user'], 403);
        }

        $me = auth()->id();

        Message::where('sender_id', $otherUserId)
            ->where('receiver_id', $me)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::between($me, $otherUserId)
            ->orderBy('created_at')
            ->get(['id', 'sender_id', 'receiver_id', 'content', 'created_at']);

        return response()->json($messages);
    }

    public function send(Request $request, $otherUserId)
    {
        if (!$this->isConnected($otherUserId)) {
            return response()->json(['error' => 'You are not connected with this user'], 403);
        }

        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $message = Message::create([
            'sender_id' => auth()->id(),
            'receiver_id' => $otherUserId,
            'content' => $request->input('content'),
        ]);

        return response()->json($message);
    }
}
