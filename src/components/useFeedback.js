import { useState } from 'react';

export function useFeedback() {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let frequency, duration, volume;

    switch (type) {
      case 'success':
        frequency = 800; // Tom agudo
        duration = 0.15;
        volume = 0.2;
        break;
      case 'error':
        frequency = 400; // Tom grave
        duration = 0.3;
        volume = 0.3;
        break;
      case 'warning':
        frequency = 600; // Tom médio
        duration = 0.2;
        volume = 0.25;
        break;
      case 'update':
        // Dois beeps rápidos
        frequency = 700;
        duration = 0.1;
        volume = 0.2;
        
        // Primeiro beep
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

        // Segundo beep
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);
          oscillator2.frequency.value = 900;
          oscillator2.type = 'sine';
          gainNode2.gain.setValueAtTime(volume, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          oscillator2.start(audioContext.currentTime);
          oscillator2.stop(audioContext.currentTime + duration);
        }, 150);
        return;
      default:
        frequency = 500;
        duration = 0.2;
        volume = 0.2;
    }

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  const showFeedback = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
    playSound(severity);
  };

  const showSuccess = (message) => {
    showFeedback(`✅ ${message}`, 'success');
  };

  const showError = (message) => {
    showFeedback(`❌ ${message}`, 'error');
  };

  const showWarning = (message) => {
    showFeedback(`⚠️ ${message}`, 'warning');
  };

  const showUpdate = (message) => {
    showFeedback(`🔁 ${message}`, 'info');
    playSound('update');
  };

  const handleClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return {
    snackbar,
    handleClose,
    showSuccess,
    showError,
    showWarning,
    showUpdate,
    showFeedback,
  };
}
