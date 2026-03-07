import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  Typography,
  IconButton,
  Button,
  Box,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import { Html5Qrcode } from "html5-qrcode";

export default function BarcodeScanner({
  open,
  onClose,
  onScan,
  title = "Escanear Codigo",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setFlashOn(false);
    setHasFlash(false);
  }, []);

  const startScanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const detect = async () => {
      if (!streamRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if ("BarcodeDetector" in window) {
          try {
            const detector = new window.BarcodeDetector({
              formats: [
                "qr_code","ean_13","ean_8","code_128","code_39",
                "code_93","upc_a","upc_e","itf","data_matrix","pdf417",
              ],
            });
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              stopCamera();
              onScan(value);
              onClose();
              return;
            }
          } catch (_) {}
        } else {
          // Fallback: html5-qrcode file scan via blob
          try {
            canvas.toBlob(async (blob) => {
              if (!blob) return;
              const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
              const scanner = new Html5Qrcode("__hidden_scanner__");
              try {
                const result = await scanner.scanFile(file, false);
                if (result) {
                  stopCamera();
                  onScan(result);
                  onClose();
                }
              } catch (_) {
              } finally {
                scanner.clear();
              }
            }, "image/jpeg", 0.8);
          } catch (_) {}
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, [onScan, onClose, stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      // Flash
      const track = mediaStream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      setHasFlash(caps.torch === true);
      setIsScanning(true);
      startScanLoop();
    } catch (err) {
      let msg = "Nao foi possivel acessar a camera.";
      if (err.name === "NotAllowedError") msg = "Permissao negada. Permita acesso a camera nas configuracoes do navegador.";
      else if (err.name === "NotFoundError") msg = "Nenhuma camera encontrada.";
      else if (err.name === "NotReadableError") msg = "Camera em uso por outro app.";
      setError(msg);
    }
  }, [startScanLoop]);

  const toggleFlash = async () => {
    if (!streamRef.current || !hasFlash) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn((v) => !v);
    } catch (_) {}
  };

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (open) startCamera();
    else stopCamera();
    return () => stopCamera();
    // eslint-disable-next-line
  }, [open]);

  return (
    <>
      {/* div oculto exigido pelo fallback html5-qrcode */}
      <div id="__hidden_scanner__" style={{ display: "none" }} />

      <Dialog open={open} onClose={handleClose} fullScreen PaperProps={{ sx: { bgcolor: "#000" } }}>
        {/* Barra Superior */}
        <Box
          sx={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 2, pt: "max(env(safe-area-inset-top), 12px)", pb: 1.5,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
          }}
        >
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: "bold" }}>
            {title}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {hasFlash && (
              <IconButton onClick={toggleFlash} sx={{ color: flashOn ? "#FFD600" : "#fff" }}>
                {flashOn ? <FlashOnIcon /> : <FlashOffIcon />}
              </IconButton>
            )}
            <IconButton onClick={handleClose} sx={{ color: "#fff" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {error ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", p: 3, gap: 2 }}>
            <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
            <Button variant="contained" onClick={() => { setError(null); startCamera(); }}>
              Tentar Novamente
            </Button>
            <Button variant="outlined" onClick={handleClose} sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
              Fechar
            </Button>
          </Box>
        ) : (
          <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Video */}
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              playsInline
              muted
            />
            {/* Canvas oculto para leitura */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Overlay escuro */}
            <Box
              sx={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)",
              }}
            />

            {/* Viewfinder */}
            <Box
              sx={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: { xs: "78%", sm: "340px" },
                height: { xs: "160px", sm: "180px" },
                pointerEvents: "none",
                overflow: "hidden",
                "&::before, &::after": { content: '""', position: "absolute" },
              }}
            >
              {/* Cantos */}
              {[
                { top: 0, left: 0, borderTop: "3px solid #4fc3f7", borderLeft: "3px solid #4fc3f7" },
                { top: 0, right: 0, borderTop: "3px solid #4fc3f7", borderRight: "3px solid #4fc3f7" },
                { bottom: 0, left: 0, borderBottom: "3px solid #4fc3f7", borderLeft: "3px solid #4fc3f7" },
                { bottom: 0, right: 0, borderBottom: "3px solid #4fc3f7", borderRight: "3px solid #4fc3f7" },
              ].map((s, i) => (
                <Box key={i} sx={{ position: "absolute", width: 24, height: 24, ...s }} />
              ))}

              {/* Linha de scan */}
              <Box
                sx={{
                  position: "absolute",
                  left: 0, right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, transparent, #4fc3f7, #00e5ff, #4fc3f7, transparent)",
                  boxShadow: "0 0 8px #00e5ff",
                  animation: "scanline 2s ease-in-out infinite",
                  "@keyframes scanline": {
                    "0%": { top: 0, opacity: 1 },
                    "45%": { top: "calc(100% - 3px)", opacity: 1 },
                    "50%": { top: "calc(100% - 3px)", opacity: 0 },
                    "51%": { top: 0, opacity: 0 },
                    "55%": { opacity: 1 },
                    "100%": { top: 0, opacity: 1 },
                  },
                }}
              />
            </Box>

            {/* Instrucoes */}
            <Typography
              variant="body2"
              sx={{
                position: "absolute",
                bottom: "18%",
                left: 0, right: 0,
                textAlign: "center",
                color: "rgba(255,255,255,0.8)",
                px: 3,
              }}
            >
              Aponte para o codigo de barras ou QR code
            </Typography>
          </Box>
        )}
      </Dialog>
    </>
  );
}

