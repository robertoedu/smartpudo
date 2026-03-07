import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
} from "@mui/icons-material";
import { Html5Qrcode } from "html5-qrcode";

const BarcodeScanner = ({
  open,
  onClose,
  onScan,
  title = "Escanear Código",
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Para a câmera e o loop de scan
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setFlashOn(false);
    setHasFlash(false);
  }, []);

  // Loop automático de leitura de frames
  const startScanLoop = useCallback((onResult) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const detect = async () => {
      if (!streamRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas
          .getContext("2d")
          .drawImage(video, 0, 0, canvas.width, canvas.height);

        if ("BarcodeDetector" in window) {
          try {
            const detector = new window.BarcodeDetector({
              formats: [
                "qr_code",
                "ean_13",
                "ean_8",
                "code_128",
                "code_39",
                "code_93",
                "upc_a",
                "upc_e",
                "itf",
                "data_matrix",
                "pdf417",
              ],
            });
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              onResult(barcodes[0].rawValue);
              return;
            }
          } catch (e) {
            void e;
          }
        } else {
          // Fallback: html5-qrcode
          try {
            await new Promise((resolve) => {
              canvas.toBlob(
                async (blob) => {
                  if (!blob) {
                    resolve();
                    return;
                  }
                  const file = new File([blob], "frame.jpg", {
                    type: "image/jpeg",
                  });
                  const scanner = new Html5Qrcode("__bcs_hidden__");
                  try {
                    const result = await scanner.scanFile(file, false);
                    if (result) {
                      onResult(result);
                      resolve();
                      return;
                    }
                  } catch (e) {
                    void e;
                  } finally {
                    try {
                      scanner.clear();
                    } catch (e2) {
                      void e2;
                    }
                    resolve();
                  }
                },
                "image/jpeg",
                0.85,
              );
            });
            if (!streamRef.current) return;
          } catch (e) {
            void e;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };
    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  // Inicia a câmera
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      const track = mediaStream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      setHasFlash(caps.torch === true);
      setScanning(true);
      startScanLoop((decoded) => {
        stopCamera();
        onScan(decoded);
        onClose();
      });
    } catch (err) {
      let msg = "Não foi possível acessar a câmera.";
      if (err.name === "NotAllowedError")
        msg =
          "Permissão negada. Permita o acesso à câmera nas configurações do navegador.";
      else if (err.name === "NotFoundError")
        msg = "Nenhuma câmera encontrada no dispositivo.";
      else if (err.name === "NotReadableError")
        msg = "Câmera em uso por outro aplicativo.";
      setError(msg);
    }
  }, [startScanLoop, stopCamera, onScan, onClose]);

  // Alternar flash
  const toggleFlash = async () => {
    if (!streamRef.current || !hasFlash) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn((v) => !v);
    } catch (e) {
      void e;
    }
  };

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Iniciar/parar scanner quando o dialog abre/fecha
  useEffect(() => {
    if (open) startCamera();
    else stopCamera();
    return () => stopCamera();
    // eslint-disable-next-line
  }, [open]);

  return (
    <>
      {/* div oculto para fallback html5-qrcode */}
      <div id="__bcs_hidden__" style={{ display: "none" }} />

      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        PaperProps={{ sx: { backgroundColor: "#000", color: "#fff" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "#fff",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            pt: "max(env(safe-area-inset-top), 12px)",
          }}
        >
          <Typography variant="h6">{title}</Typography>
          <Box>
            {hasFlash && (
              <IconButton onClick={toggleFlash} sx={{ color: "#fff", mr: 1 }}>
                {flashOn ? <FlashOnIcon /> : <FlashOffIcon />}
              </IconButton>
            )}
            <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          {error ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                p: 3,
              }}
            >
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={startCamera}
                startIcon={<CameraIcon />}
                disabled={scanning}
              >
                Tentar Novamente
              </Button>
            </Box>
          ) : (
            <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
              {/* Vídeo da câmera */}
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                playsInline
                muted
              />

              {/* Canvas oculto para captura */}
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Overlay de escaneamento */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)",
                  pointerEvents: "none",
                }}
              >
                {/* Área de escaneamento */}
                <Box
                  sx={{
                    width: "80%",
                    height: "200px",
                    border: "2px solid #fff",
                    borderRadius: 2,
                    position: "relative",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: "2px",
                      background:
                        "linear-gradient(90deg, transparent, #ff4444, transparent)",
                      animation: "scan 2s ease-in-out infinite",
                    },
                    "@keyframes scan": {
                      "0%": { transform: "translateY(-100px)" },
                      "100%": { transform: "translateY(100px)" },
                    },
                  }}
                />
              </Box>

              {/* Instruções */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 120,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  p: 2,
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, color: "#fff" }}>
                  Aponte para o código de barras
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#fff", opacity: 0.8 }}
                >
                  Posicione o código dentro da área marcada
                </Typography>
              </Box>

              {/* Botão de captura manual */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 30,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={startCamera}
                  sx={{
                    backgroundColor: "#fff",
                    color: "#000",
                    borderRadius: "50px",
                    px: 4,
                    py: 1.5,
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  Iniciar Câmera
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScanner;
