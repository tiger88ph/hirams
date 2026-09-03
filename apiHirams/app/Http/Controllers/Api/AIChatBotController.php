<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AIChatBotController extends Controller
{
    /**
     * Accepts the full message history from the client and forwards it to
     * Groq's Chat Completions API. The AI API is stateless, so the client must
     * resend the whole conversation each time (ChatWidget already does this).
     */

    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|string|in:user,assistant',
            'messages.*.content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $response = Http::withToken(config('services.groq.api_key'))
            ->timeout(30)
            ->retry(2, 500) // retry up to 2 times, 500ms apart
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'openai/gpt-oss-120b',
                'messages' => $request->messages,
            ]);

        if ($response->failed()) {
            return response()->json([
                'message' => 'AI service request failed.',
                'details' => $response->json(), // remove in production; useful while debugging
            ], 502);
        }

        $data = $response->json();

        return response()->json([
            'reply' => $data['choices'][0]['message']['content'] ?? '',
        ]);
    }
}
