import { useState, useRef, useEffect } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ScanInput from "../components/ScanInput";
import BarcodeScanner from "../components/BarcodeScanner";
import FeedbackSnackbar from "../components/FeedbackSnackbar";
import { useFeedback } from "../components/useFeedback";
import api from "../services/api";

export default function Receive() {
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [receivedProducts, setReceivedProducts] = useState([]);
  const [batchProducts, setBatchProducts] = useState([]); // Produtos acumulados no modo lote
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState(""); // "location" ou "product"
  const productInputRef = useRef(null);
  const locationInputRef = useRef(null);

  // Foca no campo de local ao carregar a página
  useEffect(() => {
    setTimeout(() => locationInputRef.current?.focus(), 100);
  }, []);

  const { snackbar, handleClose, showSuccess, showError, showWarning } =
    useFeedback();

  const handleProductChange = (e) => {
    const value = e.target.value;
    setProduct(value);
  };

  const handleProductKeyDown = async (e) => {
    if (e.key === "Enter") {
      const value = product.trim();

      // Se tentou bipar produto sem definir local
      if (value && !location.trim()) {
        showError("⚠️ Defina o local antes de bipar produtos!");
        setProduct("");
        return;
      }

      // Se há produto E local válido → salva automaticamente
      if (value && location.trim()) {
        try {
          if (batchMode) {
            // Modo lote: acumula produtos
            setBatchProducts((prev) => [...prev, value]);

            const newEntry = {
              product: value,
              location: location,
              timestamp: new Date().toLocaleTimeString("pt-BR"),
            };
            setReceivedProducts((prev) => [newEntry, ...prev].slice(0, 10));
            showSuccess(`✅ Produto ${value} adicionado ao lote!`);
            setProduct("");
          } else {
            // Modo normal: salva individualmente
            await api.post("/api/products/receive", {
              productCode: value,
              locationCode: location,
            });

            const newEntry = {
              product: value,
              location: location,
              timestamp: new Date().toLocaleTimeString("pt-BR"),
            };
            setReceivedProducts((prev) => [newEntry, ...prev].slice(0, 10));
            showSuccess("✅ Produto recebido com sucesso!");
            setProduct("");
          }
        } catch (error) {
          console.error("Erro ao receber produto:", error);
          showError("❌ Erro ao salvar produto na API");
          setProduct("");
        }
      }
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
  };

  const handleLocationKeyDown = (e) => {
    if (e.key === "Enter") {
      // Foca automaticamente no campo de produto
      setTimeout(() => productInputRef.current?.focus(), 50);
    }
  };

  const handleSendBatch = async () => {
    if (batchProducts.length === 0) return;

    try {
      const response = await api.post(
        `/api/locations/${location}/products/batch`,
        {
          products: batchProducts,
        },
      );

      const result = response.data;

      // Verifica se houve sucessos e erros
      if (result.success > 0 && result.failed > 0) {
        // Parcialmente bem-sucedido
        const firstError =
          result.results?.errors?.[0]?.message || "Erro desconhecido";
        showWarning(
          `⚠️ ${result.success} produto(s) recebido(s), mas ${result.failed} falharam. Erro: ${firstError}`,
        );
        console.error("Erros no lote:", result.results?.errors);
        // Não limpa a lista para permitir reenvio
      } else if (result.success > 0 && result.failed === 0) {
        // Totalmente bem-sucedido - limpa a lista
        showSuccess(
          `✅ Lote de ${result.success} produto(s) enviado com sucesso!`,
        );
        setBatchProducts([]);
        setProduct("");
      } else if (result.failed > 0) {
        // Totalmente falhou - não limpa para permitir reenvio
        const firstError =
          result.results?.errors?.[0]?.message || "Erro desconhecido";
        showError(`❌ Falha ao processar lote: ${firstError}`);
        console.error("Erros no lote:", result.results?.errors);
      }
    } catch (error) {
      console.error("Erro ao enviar lote:", error);
      showError(
        `❌ Erro ao enviar lote: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleBatchModeToggle = (e) => {
    const isChecked = e.target.checked;
    setBatchMode(isChecked);

    if (!isChecked) {
      // Ao desmarcar, limpa tudo
      setProduct("");
      setBatchProducts([]);
    }
  };

  // Handlers para câmera
  const handleOpenLocationScanner = () => {
    setScannerType("location");
    setScannerOpen(true);
  };

  const handleOpenProductScanner = () => {
    setScannerType("product");
    setScannerOpen(true);
  };

  const handleScanResult = async (scannedCode) => {
    if (scannerType === "location") {
      setLocation(scannedCode);
      // Auto-foca no campo de produto após definir local
      setTimeout(() => productInputRef.current?.focus(), 100);
    } else if (scannerType === "product") {
      // Simula o comportamento do Enter no campo de produto
      const value = scannedCode.trim();

      // Se tentou escanear produto sem definir local
      if (value && !location.trim()) {
        showError("⚠️ Defina o local antes de bipar produtos!");
        return;
      }

      // Lógica de recebimento (igual ao handleProductKeyDown)
      if (value) {
        if (batchMode) {
          // Modo lote: acumula produtos
          setBatchProducts((prev) => [...prev, value]);
          showSuccess(`📦 Produto ${value} adicionado ao lote!`);
        } else {
          // Modo normal: envia imediatamente
          try {
            await api.post(`/api/locations/${location}/products`, {
              productCode: value,
            });

            showSuccess(`✅ Produto ${value} recebido no local ${location}!`);
            setReceivedProducts((prev) => [
              {
                product: value,
                location: location,
                timestamp: new Date().toLocaleTimeString("pt-BR"),
              },
              ...prev.slice(0, 9),
            ]);
          } catch (error) {
            console.error("Erro ao receber produto:", error);
            showError(
              `❌ Erro ao receber produto: ${error.response?.data?.message || error.message}`,
            );
          }
        }
        setProduct("");
      }
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          maxWidth: { xs: "100%", md: "50%" },
        }}
      >
        <ScanInput
          label="Local"
          value={location}
          onChange={handleLocationChange}
          onKeyDown={handleLocationKeyDown}
          placeholder="A01-03"
          helperText={
            batchMode
              ? "Local fixado para recebimento em lote"
              : "Bipe ou digite o código do local primeiro"
          }
          disabled={batchMode && location.trim() !== ""}
          onCameraClick={handleOpenLocationScanner}
          inputRef={locationInputRef}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={batchMode}
              onChange={handleBatchModeToggle}
              disabled={!location.trim()}
            />
          }
          label={
            batchMode && batchProducts.length > 0
              ? `Fixar local (Modo Lote - ${batchProducts.length} produtos acumulados)`
              : "Fixar local (Modo Lote)"
          }
        />

        <ScanInput
          label="Código do Produto"
          value={product}
          onChange={handleProductChange}
          onKeyDown={handleProductKeyDown}
          placeholder="Bipe ou digite o código do produto"
          autoFocus={batchMode}
          helperText={
            location.trim()
              ? "Bipe o produto - salvamento automático"
              : "Defina o local primeiro"
          }
          inputRef={productInputRef}
          onCameraClick={handleOpenProductScanner}
        />

        {batchMode && batchProducts.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<SendIcon />}
            onClick={handleSendBatch}
            sx={{
              py: 1.5,
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            Enviar Lote ({batchProducts.length}{" "}
            {batchProducts.length === 1 ? "produto" : "produtos"})
          </Button>
        )}

        {receivedProducts.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Últimos Recebimentos</Typography>
              <Chip
                label={`${receivedProducts.length} ${
                  receivedProducts.length === 1 ? "salvo" : "salvos"
                }`}
                color="success"
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {receivedProducts.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: "rgba(144, 202, 249, 0.08)",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.product}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.location}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.timestamp}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      {/* ConfirmBar removido - salvamento é automático */}

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
        title={
          scannerType === "location" ? "Escanear Local" : "Escanear Produto"
        }
      />

      <FeedbackSnackbar snackbar={snackbar} onClose={handleClose} />
    </Box>
  );
}
