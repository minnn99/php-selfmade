<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMenstrualCycleRequest extends FormRequest
{
    public function authorize()
    {
        return true; // 認証済みユーザーのみアクセス可能
    }

    public function rules()
    {
        return [
            'start_date' => 'required|date|before_or_equal:today',
            'flow_intensity' => 'nullable|integer|between:1,5',
            'symptoms' => 'nullable|array|max:20',
            'symptoms.*' => 'string|max:100',
            'notes' => 'nullable|string|max:1000'
        ];
    }

    public function messages()
    {
        return [
            'start_date.required' => '開始日は必須です',
            'start_date.date' => '有効な日付を入力してください',
            'start_date.before_or_equal' => '開始日は今日以前の日付である必要があります',
            'flow_intensity.between' => '経血量は1-5の範囲で入力してください',
            'symptoms.array' => '症状は配列形式で送信してください',
            'symptoms.*.max' => '症状は100文字以内で入力してください',
            'notes.max' => 'メモは1000文字以内で入力してください'
        ];
    }

    protected function prepareForValidation()
    {
        // SQLインジェクション対策として特殊文字をサニタイズ
        $this->merge([
            'notes' => $this->sanitizeInput($this->input('notes')),
            'symptoms' => $this->sanitizeArray($this->input('symptoms', []))
        ]);
    }

    private function sanitizeInput(?string $input): ?string
    {
        if (!$input) return null;
        
        // HTMLタグ除去
        $input = strip_tags($input);
        
        // SQLインジェクション対策
        $input = str_replace(['<script', '</script>', 'javascript:', 'onload=', 'onclick='], '', $input);
        
        return trim($input);
    }

    private function sanitizeArray(?array $input): array
    {
        if (!$input) return [];
        
        return array_map(function($item) {
            return $this->sanitizeInput($item);
        }, $input);
    }
}