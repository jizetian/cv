import { Camera } from 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
import { Hands, HAND_CONNECTIONS } from 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
import { drawConnectors, drawLandmarks } from 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';

const initGestureRecognition = () => {
  const videoElement = document.getElementById('input_video');
  const canvasElement = document.getElementById('output_canvas');
  const ctx = canvasElement.getContext('2d');
  let lastAlertTime = 0;

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults((results) => {
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 竖中指检测逻辑
    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach(landmarks => {
        // 中指指尖（8号点）和掌根（0号点）
        const tip = landmarks[8];
        const root = landmarks[0];
        
        // Y坐标比较（摄像头画面坐标系Y轴向下）
        if (tip && root && tip.y > root.y + 0.3) {
          const now = Date.now();
          if (now - lastAlertTime > 1000) {
            lastAlertTime = now;
            const overlay = document.getElementById('alertOverlay');
            overlay.querySelector('.alert-box').textContent = '李小狗素质666';
            overlay.style.display = 'flex';
            setTimeout(() => {
              overlay.style.display = 'none';
            }, 2000);
          }
        }
      });
    }

    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach(landmarks => {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
        drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 1
        });
      });
    }
    ctx.restore();
  });

  document.getElementById('startButton').addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });

      videoElement.srcObject = stream;
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });

      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: videoElement.videoWidth,
        height: videoElement.videoHeight
      }).start();

    } catch (error) {
      console.error('摄像头初始化失败:', error);
      alert(`无法访问摄像头: ${error.message}`);
    }
  });
};

document.addEventListener('DOMContentLoaded', initGestureRecognition);