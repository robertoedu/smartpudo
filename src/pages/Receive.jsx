import { useState, useRef, useEffect } from "react";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import ScanInput from "../components/ScanInput";
import FeedbackSnackbar from "../components/FeedbackSnackbar";
import { useFeedback } from "../components/useFeedback";
import BatchProductList from "../components/receive/BatchProductList";
import RecentReceiptsList from "../components/receive/RecentReceiptsList";
import api from "../services/api";

export default function Receive() {
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [receivedProducts, setReceivedProducts] = useState([]);
  const [batchProducts, setBatchProducts] = useState([]);
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
            // Se local não está fixado, limpa e volta o foco para o campo de local
            if (!batchMode) {
              setLocation("");
              setTimeout(() => locationInputRef.current?.focus(), 50);
            }
          }
        } catch (error) {
          console.error("Erro ao receber produto:", error);
          showError(
            `❌ ${error.response?.data?.message || "Erro ao salvar produto na API"}`,
          );
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
          inputRef={locationInputRef}
        />

        <FormControlLabel
          control={
            <Checkbox checked={batchMode} onChange={handleBatchModeToggle} />
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
        />

        {batchMode && (
          <BatchProductList
            products={batchProducts}
            location={location}
            onSend={handleSendBatch}
            onRemove={(index) => setBatchProducts((prev) => prev.filter((_, i) => i !== index))}
            onUpdate={(index, value) =>
              setBatchProducts((prev) => {
                const updated = [...prev];
                updated[index] = value;
                return updated;
              })
            }
          />
        )}

        {!batchMode && (
          <RecentReceiptsList items={receivedProducts} />
        )}
      </Box>

      {/* ConfirmBar removido - salvamento é automático */}

      <FeedbackSnackbar snackbar={snackbar} onClose={handleClose} />
    </Box>
  );
}
