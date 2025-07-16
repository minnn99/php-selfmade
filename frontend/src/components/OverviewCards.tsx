import React from 'react';

export const OverviewCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Next Period Card */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">次回の生理予定日</h3>
          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">1月18日</p>
          <p className="text-sm text-gray-500">あと6日</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full" style={{width: '75%'}}></div>
          </div>
        </div>
      </div>

      {/* Current Cycle Card */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">現在の周期</h3>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">22日目</p>
          <p className="text-sm text-gray-500">28日周期</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full" style={{width: '79%'}}></div>
          </div>
        </div>
      </div>

      {/* Ovulation Card */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">排卵予定日</h3>
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold text-gray-900">1月4日</p>
          <p className="text-sm text-gray-500">8日前に終了</p>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-xs text-gray-500">妊娠しやすい期間</span>
          </div>
        </div>
      </div>
    </div>
  );
};