<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenstrualCycleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // コントローラーで所有者チェックを行うため、ここではtrueを返す
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|nullable|date|after_or_equal:start_date',
            'flow_intensity' => 'sometimes|nullable|integer|min:1|max:5',
            'symptoms' => 'sometimes|nullable|array',
            'symptoms.*' => 'string|max:100',
            'notes' => 'sometimes|nullable|string|max:1000'
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // notesフィールドのサニタイズ
        if ($this->has('notes')) {
            $this->merge([
                'notes' => $this->sanitizeInput($this->notes)
            ]);
        }

        // symptomsフィールドのサニタイズ
        if ($this->has('symptoms') && is_array($this->symptoms)) {
            $sanitizedSymptoms = array_map([$this, 'sanitizeInput'], $this->symptoms);
            $this->merge([
                'symptoms' => $sanitizedSymptoms
            ]);
        }
    }

    /**
     * SQLインジェクションとXSS攻撃を防ぐための入力サニタイズ
     */
    private function sanitizeInput(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }

        // HTMLタグを除去
        $input = strip_tags($input);
        
        // SQLインジェクション用の危険な文字をエスケープ
        $dangerousPatterns = [
            '/[\'";]/' => '',  // シングル/ダブルクォート、セミコロンを除去
            '/--/' => '',      // SQLコメントを除去
            '/\/\*.*?\*\//s' => '', // SQLブロックコメントを除去
            '/\bDROP\b/i' => '',    // DROP文を除去
            '/\bDELETE\b/i' => '',  // DELETE文を除去
            '/\bINSERT\b/i' => '',  // INSERT文を除去
            '/\bUPDATE\b/i' => '',  // UPDATE文を除去
            '/\bSELECT\b/i' => '',  // SELECT文を除去
            '/\bUNION\b/i' => '',   // UNION文を除去
            '/\bEXEC\b/i' => '',    // EXEC文を除去
            '/\bSCRIPT\b/i' => '',  // SCRIPT文を除去
        ];

        foreach ($dangerousPatterns as $pattern => $replacement) {
            $input = preg_replace($pattern, $replacement, $input);
        }

        // 余分な空白を削除
        $input = trim($input);
        $input = preg_replace('/\s+/', ' ', $input);

        return $input;
    }
}