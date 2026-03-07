import { useState } from "react";
import { Box, Alert, Typography, Paper } from "@mui/material";
import ScanInput from "../components/ScanInput";
import ConfirmBar from "../components/ConfirmBar";
import FeedbackSnackbar from "../components/FeedbackSnackbar";
import { useFeedback } from "../components/useFeedback";
import api from "../services/api";

export default function Withdraw() {
  const [product, setProduct] = useState("");
  const [lastProduct, setLastProduct] = useState("");
  const [foundLocation, setFoundLocation] = useState(null);
  const [readyToConfirm, setReadyToConfirm] = useState(false);

  const { snackbar, handleClose, showSuccess, showError, showWarning } =
    useFeedback();

  const handleSearch = async (productCode) => {
    try {
      const { data } = await api.get(`/api/products/${productCode}/location`);

      // API pode retornar { location: { code, name } } ou { code, name } diretamente
      const normalized = data?.location ?? (data?.code ? data : null);
      if (!normalized) {
        showWarning("⚠️ Produto sem localização cadastrada");
        setFoundLocation(null);
        setReadyToConfirm(false);
        return;
      }
      setFoundLocation(normalized);
      setReadyToConfirm(true);
    } catch (error) {
      console.error("Erro ao buscar produto:", error);

      if (error.response?.status === 404) {
        showWarning("⚠️ Produto não encontrado no estoque");
      } else {
        showError("❌ Erro ao buscar localização do produto");
      }

      setFoundLocation(null);
      setReadyToConfirm(false);
    }
  };

  const handleProductKeyDown = (e) => {
    if (e.key === "Enter") {
      const value = product.trim();

      if (!value) return;

      // Se ainda não buscou OU é um produto diferente
      if (!foundLocation || value !== lastProduct) {
        handleSearch(value);
        setLastProduct(value);
        setReadyToConfirm(true);
      }
      // Se é o mesmo produto (segundo bip) → confirma
      else if (value === lastProduct && readyToConfirm) {
        handleConfirm();
      }
    }
  };

  const handleConfirm = async () => {
    try {
      await api.post("/api/products/withdraw", {
        productCode: product,
        locationCode: foundLocation?.code,
      });

      showSuccess("✅ Produto retirado com sucesso!");
      // Limpa o estado
      setProduct("");
      setLastProduct("");
      setFoundLocation(null);
      setReadyToConfirm(false);
    } catch (error) {
      console.error("Erro ao retirar produto:", error);
      if (error.response?.status === 404) {
        showError("❌ Produto não encontrado neste local");
      } else if (error.response?.status === 400) {
        showError("❌ Quantidade insuficiente em estoque");
      } else {
        showError("❌ Erro ao retirar produto");
      }
    }
  };

  const handleClear = () => {
    setProduct("");
    setLastProduct("");
    setFoundLocation(null);
    setReadyToConfirm(false);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          maxWidth: { xs: "100%", md: "50%" },
          mx: "auto",
          pt: 4,
        }}
      >
        <ScanInput
          label="Código do Produto"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          onKeyDown={handleProductKeyDown}
          placeholder="Bipe ou digite o código do produto"
          autoFocus
          helperText={
            readyToConfirm
              ? "Pressione Enter para confirmar"
              : "Bipe o produto para buscar a localização"
          }
        />
      </Box>

      {/* Exibição grande e centralizada do produto e local */}
      {foundLocation && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
            mb: 4,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              textAlign: "center",
              backgroundColor: "rgba(46, 125, 50, 0.1)",
              borderRadius: 3,
              border: "2px solid",
              borderColor: "success.main",
              minWidth: { xs: "90%", sm: "500px" },
            }}
          >
            <Typography
              variant="h4"
              color="success.main"
              gutterBottom
              fontWeight="bold"
            >
              📦 Produto Encontrado
            </Typography>

            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Código do Produto
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 3 }}>
                {product}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Localização
              </Typography>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {foundLocation?.code}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {foundLocation?.name}
              </Typography>
            </Box>

            {readyToConfirm && (
              <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  ⚡ Pressione Enter ou confirme a retirada
                </Typography>
              </Alert>
            )}
          </Paper>
        </Box>
      )}

      {foundLocation && (
        <ConfirmBar
          text={`Produto: ${product} será retirado de ${foundLocation.code}`}
          primaryLabel="Confirmar retirada"
          onPrimary={handleConfirm}
          secondaryLabel="Limpar"
          onSecondary={handleClear}
        />
      )}

      <FeedbackSnackbar snackbar={snackbar} onClose={handleClose} />
    </Box>
  );
}
