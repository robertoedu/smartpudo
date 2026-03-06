import { useEffect, useRef, useState, useCallback } from "react";
import { Modal, Box, IconButton, Typography, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import { Html5Qrcode } from "html5-qrcode";

export default function BarcodeScanner({
  open,
  onClose,
  onScan,
  title = "Escanear Código",
}) {
  const html5QrCodeRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
  }, [isScanning]);

  const tryFrontCamera = useCallback(async () => {
    setError("");
    try {
      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {},
      );
      setIsScanning(true);
    } catch (err) {
      setError(`Falha ao acessar câmera: ${err.message}`);
    }
  }, [onScan, onClose, stopScanner]);

  const startScanner = useCallback(async () => {
    setError("");

    try {
      // Aguardar o elemento estar disponível no DOM
      await new Promise((resolve) => {
        const checkElement = () => {
          const element = document.getElementById("qr-reader");
          if (element) {
            resolve();
          } else {
            setTimeout(checkElement, 100);
          }
        };
        checkElement();
      });

      const scanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = scanner;

      // Configuração para mobile - usar facingMode
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      // Tentar câmera traseira primeiro
      let cameraConfig = { facingMode: "environment" };

      // Se já temos lista de câmeras, usar ID específico
      if (cameras.length > 0) {
        cameraConfig = cameras[currentCameraIndex]?.id || cameraConfig;
      }

      await scanner.start(
        cameraConfig,
        config,
        (decodedText) => {
          // Sucesso ao escanear
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Ignorar erros de leitura contínua
        },
      );

      setIsScanning(true);

      // Obter lista de câmeras (assíncrono, não bloqueia)
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
          }
        })
        .catch(() => {
          // Ignorar erro ao listar câmeras
        });
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);

      let errorMessage = "Erro ao acessar a câmera.";

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Permissão negada. Toque em 'Permitir' quando o navegador solicitar acesso à câmera.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        errorMessage = "Câmera em uso por outro aplicativo. Feche outros apps.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "Tentando câmera frontal...";
        setError(errorMessage);
        // Tentar câmera frontal
        setTimeout(() => tryFrontCamera(), 1000);
        return;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  }, [
    cameras,
    currentCameraIndex,
    onScan,
    onClose,
    stopScanner,
    tryFrontCamera,
  ]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line
  }, [open]);

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    await stopScanner();
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        stopScanner();
        onClose();
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: { xs: "95%", sm: "500px" },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
          position: "relative",
        }}
      >
        {/* Botão fechar */}
        <IconButton
          onClick={() => {
            stopScanner();
            onClose();
          }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Título */}
        <Typography variant="h6" mb={2} textAlign="center">
          {title}
        </Typography>

        {/* Erro */}
        {error && (
          <Box
            sx={{
              bgcolor: "error.main",
              color: "white",
              p: 2,
              borderRadius: 1,
              mb: 2,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" fontWeight="bold" mb={1}>
              {error}
            </Typography>

            {error.includes("Permissão") && (
              <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                💡 Quando solicitado, toque em "Permitir" para acessar a câmera.
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              {error.includes("Permissão") && (
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => {
                    setError("");
                    startScanner();
                  }}
                  sx={{
                    bgcolor: "white",
                    color: "success.main",
                    fontWeight: "bold",
                    "&:hover": { bgcolor: "success.light", color: "white" },
                  }}
                >
                  🔄 Tentar Novamente
                </Button>
              )}

              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={() => {
                  setError("");
                  onClose();
                }}
                sx={{
                  bgcolor: "white",
                  color: "error.main",
                  fontWeight: "bold",
                  "&:hover": { bgcolor: "grey.200" },
                }}
              >
                Fechar
              </Button>
            </Box>
          </Box>
        )}

        {/* Área do scanner */}
        <Box
          id="qr-reader"
          sx={{
            width: "100%",
            borderRadius: 2,
            overflow: "hidden",
            display: error ? "none" : "block",
            "& video": {
              borderRadius: 2,
            },
          }}
        />

        {/* Trocar câmera */}
        {cameras.length > 1 && !error && (
          <Button
            startIcon={<FlipCameraIosIcon />}
            onClick={switchCamera}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Trocar Câmera
          </Button>
        )}

        {!error && (
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            mt={2}
            color="text.secondary"
          >
            📷 Aponte a câmera para o código de barras ou QR code
          </Typography>
        )}
      </Box>
    </Modal>
  );
}
