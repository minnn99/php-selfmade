<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * ユーザー登録
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                'min:1',
                'max:50',
                'regex:/^[ぁ-んァ-ヶ一-龯a-zA-Z\s]+$/u'
            ],
            'furigana' => [
                'required',
                'string',
                'min:1',
                'max:50',
                'regex:/^[ァ-ヶー\s]+$/u'
            ],
            'gender' => 'required|string|in:male,female',
            'phone' => [
                'required',
                'string',
                'max:20',
                'regex:/^(0\d{1,4}-\d{1,4}-\d{4}|0\d{10,11})$/'
            ],
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/', // 大文字を含む
                'regex:/[0-9]/'  // 数字を含む
            ],
        ], [
            'name.required' => 'お名前は必須です。',
            'name.min' => 'お名前は1文字以上で入力してください。',
            'name.max' => 'お名前は50文字以内で入力してください。',
            'name.regex' => 'お名前は日本語・英語のみ使用できます。',
            'furigana.required' => 'フリガナは必須です。',
            'furigana.min' => 'フリガナは1文字以上で入力してください。',
            'furigana.max' => 'フリガナは50文字以内で入力してください。',
            'furigana.regex' => 'フリガナは全角カタカナのみ入力してください。',
            'gender.required' => '性別を選択してください。',
            'gender.in' => '正しい性別を選択してください。',
            'phone.required' => '電話番号は必須です。',
            'phone.regex' => '正しい電話番号を入力してください。',
            'email.required' => 'メールアドレスは必須です。',
            'email.email' => '正しいメールアドレス形式で入力してください。',
            'email.max' => 'メールアドレスは255文字以内で入力してください。',
            'email.unique' => 'このメールアドレスは既に登録されています。',
            'password.min' => 'パスワードは8文字以上で入力してください。',
            'password.regex' => 'パスワードは大文字と数字を含む必要があります。',
        ]);

        return DB::transaction(function () use ($request) {
            $user = new User();
            $user->name = $request->name;
            $user->furigana = $request->furigana;
            $user->gender = $request->gender;
            $user->phone = $request->phone;
            $user->email = $request->email;
            $user->password = Hash::make($request->password);
            $user->save();

            $tokenResult = $user->createToken('auth_token');
            $token = $tokenResult->plainTextToken;
            $expiresAt = $tokenResult->accessToken->expires_at ?? now()->addMinutes(config('sanctum.expiration'));

            return response()->json([
                'success' => true,
                'message' => 'ユーザー登録が完了しました',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'gender' => $user->gender,
                        'phone' => $user->phone,
                        'email' => $user->email,
                        'created_at' => $user->created_at,
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_at' => $expiresAt->toISOString(),
                    'expires_in' => config('sanctum.expiration') * 60,
                ]
            ], 201);
        });
    }

    /**
     * ログイン
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8',
            'remember_me' => 'boolean',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'メールアドレスまたはパスワードが正しくありません。',
                'errors' => [
                    'email' => ['メールアドレスまたはパスワードが正しくありません。']
                ]
            ], 401);
        }

        // 既存のトークンを削除（オプション）
        $user->tokens()->delete();

        // remember_meに基づいてトークンの有効期限を決定
        $rememberMe = $request->boolean('remember_me', false);
        $expirationMinutes = $rememberMe ? 10080 : config('sanctum.expiration'); // 7日間 or デフォルト

        $tokenResult = $user->createToken('auth_token');
        $token = $tokenResult->plainTextToken;
        $expiresAt = $tokenResult->accessToken->expires_at ?? now()->addMinutes($expirationMinutes);

        return response()->json([
            'success' => true,
            'message' => 'ログインしました',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'gender' => $user->gender,
                    'phone' => $user->phone,
                ],
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_at' => $expiresAt->toISOString(),
                'expires_in' => $expirationMinutes * 60, // 秒単位
                'remember_me' => $rememberMe,
            ]
        ]);
    }

    /**
     * ログアウト
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'ログアウトしました'
        ]);
    }

    /**
     * ユーザー情報取得
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'gender' => $request->user()->gender,
                    'phone' => $request->user()->phone,
                    'created_at' => $request->user()->created_at,
                ]
            ]
        ]);
    }

    /**
     * パスワードリセット（仮実装）
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // TODO: パスワードリセット機能の実装
        // 現在は仮のレスポンスを返す

        return response()->json([
            'success' => true,
            'message' => 'パスワードリセットのメールを送信しました。'
        ]);
    }

    /**
     * アカウント削除
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // 関連するトークンを全て削除
        $user->tokens()->delete();
        
        // ユーザーアカウントを削除（関連データは外部キー制約により自動削除）
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'アカウントが正常に削除されました。'
        ]);
    }
}
