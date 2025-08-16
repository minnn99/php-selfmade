<?php

namespace Database\Seeders;

use App\Models\MenstrualCycle;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class MenstrualCycleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first user (or create one if none exists)
        $user = User::first();
        if (!$user) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'gender' => 'female',
                'phone' => '090-1234-5678'
            ]);
        }

        // Create sample menstrual cycle data for the past 6 months
        $cycles = [];
        $startDate = Carbon::now()->subMonths(6);

        // Create 6 cycles with realistic data
        for ($i = 0; $i < 6; $i++) {
            $cycleStart = $startDate->copy()->addDays($i * 28 + rand(-3, 3)); // 25-31 day cycles
            $cycleEnd = $cycleStart->copy()->addDays(rand(3, 7)); // 4-8 day periods
            
            $symptoms = $this->getRandomSymptoms();
            
            $cycles[] = [
                'user_id' => $user->id,
                'start_date' => $cycleStart->format('Y-m-d'),
                'end_date' => $cycleEnd->format('Y-m-d'),
                'flow_intensity' => rand(2, 4), // Random flow intensity 2-4
                'symptoms' => json_encode($symptoms),
                'notes' => $this->getRandomNote(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert the cycles
        MenstrualCycle::insert($cycles);
    }

    /**
     * Get random symptoms for a cycle
     */
    private function getRandomSymptoms(): array
    {
        $allSymptoms = [
            '腹痛',
            '頭痛',
            '腰痛',
            'イライラ',
            'むくみ',
            '眠気',
            '食欲増加',
            '気分の落ち込み',
            '胸の張り',
            'PMS',
            '生理痛',
            '倦怠感',
            '集中力低下',
            '肌荒れ',
            '便秘',
            '下痢'
        ];

        // Random 2-5 symptoms per cycle
        $numSymptoms = rand(2, 5);
        $selectedSymptoms = array_rand(array_flip($allSymptoms), $numSymptoms);
        
        return is_array($selectedSymptoms) ? $selectedSymptoms : [$selectedSymptoms];
    }

    /**
     * Get random note for a cycle
     */
    private function getRandomNote(): ?string
    {
        $notes = [
            '今月は軽めでした',
            '痛みが強かったです',
            '普通の周期でした',
            'ストレスが多い時期でした',
            '体調は良好でした',
            null, // Some cycles have no notes
            null,
        ];

        return $notes[array_rand($notes)];
    }
}