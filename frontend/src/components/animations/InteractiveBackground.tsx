import React, { useEffect, useRef, useState } from 'react';

interface WavePoint {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  amplitude: number;
  frequency: number;
  phase: number;
  opacity: number;
  color: string;
}

interface InteractiveBackgroundProps {
  className?: string;
}

// 生理周期アプリに合うカラーパレット（ウェーブ用）
// ライトモード用の色
const lightWaveColors: string[] = [
  'rgba(255, 182, 193, 0.5)', // ライトピンク
  'rgba(255, 192, 203, 0.45)', // ピンク
  'rgba(230, 230, 250, 0.4)', // ラベンダー
  'rgba(240, 248, 255, 0.5)', // アリスブルー
  'rgba(255, 228, 225, 0.45)', // ミスティローズ
];

// ダークモード用の控えめな色
const darkWaveColors: string[] = [
  'rgba(147, 51, 234, 0.15)', // 紫（控えめ）
  'rgba(99, 102, 241, 0.12)', // インディゴ（控えめ）
  'rgba(59, 130, 246, 0.1)', // ブルー（控えめ）
  'rgba(139, 92, 246, 0.12)', // バイオレット（控えめ）
  'rgba(168, 85, 247, 0.1)', // パープル（控えめ）
];

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const wavePointsRef = useRef<WavePoint[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // ダークモードの検出
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      return isDark;
    };

    // 初回チェック
    const currentIsDark = checkDarkMode();

    // MutationObserverでダークモード切り替えを監視
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズを設定
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ウェーブポイントを初期化
    const initWavePoints = () => {
      wavePointsRef.current = [];
      const waveCount = Math.min(6, Math.max(3, Math.floor(canvas.height / 200))); // レスポンシブウェーブ数
      const waveColors = currentIsDark ? darkWaveColors : lightWaveColors;

      for (let i = 0; i < waveCount; i++) {
        const baseY = (canvas.height / (waveCount + 1)) * (i + 1);
        const baseOpacity = currentIsDark ? Math.random() * 0.15 + 0.1 : Math.random() * 0.3 + 0.5;
        wavePointsRef.current.push({
          x: 0,
          y: baseY,
          baseY: baseY,
          vx: Math.random() * 0.5 + 0.2, // 横移動速度
          vy: 0,
          amplitude: Math.random() * 30 + 20, // ウェーブの振幅
          frequency: Math.random() * 0.02 + 0.01, // ウェーブの周波数
          phase: Math.random() * Math.PI * 2, // 位相
          opacity: baseOpacity,
          color: waveColors[Math.floor(Math.random() * waveColors.length)]
        });
      }
    };

    initWavePoints();

    // マウス追跡
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // アニメーションループ
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.01;

      wavePointsRef.current.forEach((wave) => {
        // マウスとウェーブの距離を計算
        const mouseDistanceToWave = Math.abs(mouseRef.current.y - wave.baseY);
        const mouseEffect = Math.max(0, 1 - mouseDistanceToWave / 200); // ウェーブとマウスの垂直距離

        // ウェーブパスを作成
        ctx.save();
        ctx.globalAlpha = wave.opacity + mouseEffect * 0.4; // マウス近くで明るくなる
        ctx.lineWidth = 2 + mouseEffect * 4; // マウス近くで太くなる
        ctx.lineCap = 'round';
        
        // 動的カラー変更（マウス近くでより鮮やか）
        const baseColor = wave.color;
        const enhancedColor = baseColor.replace(/[\d.]+\)$/g, `${0.3 + mouseEffect * 0.5})`);
        
        // グラデーション効果（マウス位置中心）
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, baseColor.replace(/[\d.]+\)$/g, '0.3)'));
        
        // マウス位置での色を強調
        const mouseXRatio = mouseRef.current.x / canvas.width;
        if (mouseXRatio > 0 && mouseXRatio < 1) {
          gradient.addColorStop(Math.max(0, mouseXRatio - 0.1), baseColor.replace(/[\d.]+\)$/g, '0.4)'));
          gradient.addColorStop(mouseXRatio, enhancedColor);
          gradient.addColorStop(Math.min(1, mouseXRatio + 0.1), baseColor.replace(/[\d.]+\)$/g, '0.4)'));
        } else {
          gradient.addColorStop(0.5, enhancedColor);
        }
        
        gradient.addColorStop(1, baseColor.replace(/[\d.]+\)$/g, '0.3)'));
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        
        // ウェーブを描画
        for (let x = 0; x <= canvas.width; x += 1) {
          const normalWaveY = wave.baseY + 
            Math.sin((x * wave.frequency) + (timeRef.current * 2) + wave.phase) * wave.amplitude;
          
          // マウスの強い影響でウェーブを大きく歪める
          const distanceToMouse = Math.sqrt(
            Math.pow(x - mouseRef.current.x, 2) + 
            Math.pow(normalWaveY - mouseRef.current.y, 2)
          );
          
          const mouseInfluence = Math.max(0, 1 - distanceToMouse / 150); // 影響範囲を狭く、強く
          
          // マウス位置に強く引き寄せられる
          const pullStrength = mouseInfluence * mouseInfluence * 0.8; // 二乗で非線形効果
          const finalY = normalWaveY + (mouseRef.current.y - normalWaveY) * pullStrength;

          if (x === 0) {
            ctx.moveTo(x, finalY);
          } else {
            ctx.lineTo(x, finalY);
          }
        }
        
        ctx.stroke();
        
        // マウス近くでより強いグロー効果
        if (mouseEffect > 0.1) {
          ctx.shadowColor = enhancedColor;
          ctx.shadowBlur = 15 + mouseEffect * 20;
          ctx.stroke();
        }
        
        ctx.restore();
      });

      // マウス位置にインジケーターを表示
      if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
        ctx.save();
        
        // 外側のリング
        const ringColor = currentIsDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 182, 193, 0.6)';
        ctx.globalAlpha = currentIsDark ? 0.2 : 0.3;
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 40 + Math.sin(timeRef.current * 5) * 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内側の点
        const dotColor = currentIsDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 182, 193, 0.8)';
        ctx.globalAlpha = currentIsDark ? 0.3 : 0.6;
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // 少し遅延してアニメーション開始
    setTimeout(() => {
      setIsVisible(true);
      animate();
    }, 100);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // ダークモード変更時にウェーブポイントを再初期化
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const waveColors = isDarkMode ? darkWaveColors : lightWaveColors;
    
    wavePointsRef.current.forEach((wave) => {
      wave.opacity = isDarkMode ? Math.random() * 0.15 + 0.1 : Math.random() * 0.3 + 0.5;
      wave.color = waveColors[Math.floor(Math.random() * waveColors.length)];
    });
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};