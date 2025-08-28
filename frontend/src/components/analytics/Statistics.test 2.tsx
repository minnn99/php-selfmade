import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Statistics } from './Statistics';
import { menstrualCycleAPI, dailySymptomsAPI } from '../../services/api';

// APIをモック化
vi.mock('../../services/api', () => ({
  menstrualCycleAPI: {
    getCycles: vi.fn(),
  },
  dailySymptomsAPI: {
    getSymptomsRange: vi.fn(),
  },
}));

const mockMenstrualCycleAPI = vi.mocked(menstrualCycleAPI);
const mockDailySymptomsAPI = vi.mocked(dailySymptomsAPI);

describe('Statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    mockMenstrualCycleAPI.getCycles.mockImplementation(() => new Promise(() => {}));

    render(<Statistics />);
    
    expect(screen.getByText('統計データを読み込み中...')).toBeTruthy();
  });

  it('データがない場合のメッセージを表示する', async () => {
    mockMenstrualCycleAPI.getCycles.mockResolvedValue({ success: true, data: [] });

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText('統計データがありません')).toBeTruthy();
    });
  });

  it('エラーが発生した場合のエラーメッセージを表示する', async () => {
    mockMenstrualCycleAPI.getCycles.mockRejectedValue(new Error('ネットワークエラー'));

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText('データの読み込みに失敗しました')).toBeTruthy();
    });
  });

  it('周期統計を正しく表示する', async () => {
    const mockCycleData = [
      {
        id: 1,
        start_date: '2024-01-01',
        end_date: '2024-01-05',
        flow_intensity: 3,
      },
      {
        id: 2,
        start_date: '2024-01-29',
        end_date: '2024-02-03',
        flow_intensity: 2,
      },
    ];

    mockMenstrualCycleAPI.getCycles.mockResolvedValue({ success: true, data: mockCycleData });
    mockDailySymptomsAPI.getSymptomsRange.mockResolvedValue({ 
      success: true, 
      data: {}
    });

    render(<Statistics />);

    await waitFor(() => {
      expect(screen.getByText('統計・分析')).toBeTruthy();
    });

    expect(screen.getByText('平均周期長')).toBeTruthy();
    expect(screen.getByText('平均生理期間')).toBeTruthy();
  });
});