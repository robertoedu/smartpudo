import { useState } from "react";
import {
  Box,
  Dialog,
  Typography,
  IconButton,
  Chip,
  Paper,
  TablePagination,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFeedback } from "../useFeedback";
import FeedbackSnackbar from "../FeedbackSnackbar";
import api from "../../services/api";

export default function ViewLocationModal({ open, location, onClose }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [removingProduct, setRemovingProduct] = useState(null);
  const [removedProducts, setRemovedProducts] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const {
    snackbar,
    handleClose: handleCloseSnackbar,
    showSuccess,
    showError,
  } = useFeedback();

  const handleClose = () => {
    setPage(0);
    onClose(hasChanges);
    // Reset estados após fechar
    setTimeout(() => {
      setRemovedProducts(new Set());
      setHasChanges(false);
    }, 300);
  };

  const handleRemoveProduct = async (product) => {
    if (!product || !location) return;

    setRemovingProduct(product.code);
    try {
      await api.post("/api/products/withdraw", {
        productCode: product.code,
        locationCode: location.code,
      });

      // Adiciona o produto à lista de removidos
      setRemovedProducts((prev) => new Set([...prev, product.code]));
      setHasChanges(true);
      setRemovingProduct(null);

      showSuccess(`✅ Produto ${product.code} removido com sucesso!`);
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      if (error.response?.status === 404) {
        showError("❌ Produto não encontrado neste local");
      } else if (error.response?.status === 400) {
        showError("❌ Quantidade insuficiente em estoque");
      } else {
        showError("❌ Erro ao remover produto");
      }
      setRemovingProduct(null);
    }
  };

  // Filtra produtos removidos da lista
  const products = (location?.products || []).filter(
    (product) => !removedProducts.has(product.code)
  );
  const visibleProducts =
    rowsPerPage === -1
      ? products
      : products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (!open || !location) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: "2px solid",
            borderColor: "primary.main",
            maxHeight: "90vh",
          },
        }}
      >
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 3,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                color="primary.main"
                fontWeight="bold"
                gutterBottom
                sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
              >
                📍 {location.code}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                {location.name}
              </Typography>
              <Chip
                label={`${products.length} produto${products.length !== 1 ? "s" : ""}`}
                color="primary"
                sx={{ mt: 2, fontWeight: "bold" }}
                size="medium"
              />
            </Box>
            <IconButton
              onClick={handleClose}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "error.main" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: "divider", my: 3 }} />

          {/* Products List */}
          {products.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="text.secondary">
                📦 Nenhum produto armazenado neste local
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {visibleProducts.map((product, index) => (
                  <Paper
                    key={index}
                    elevation={3}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      backgroundColor: "rgba(33, 150, 243, 0.05)",
                      borderRadius: 2,
                      border: "1px solid rgba(33, 150, 243, 0.2)",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(33, 150, 243, 0.1)",
                        transform: "translateY(-2px)",
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 2,
                      }}
                    >
                      {/* Product Info */}
                      <Box sx={{ flex: 1, width: "100%" }}>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="primary.main"
                          sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                        >
                          {product.code}
                        </Typography>
                        {product.name && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {product.name}
                          </Typography>
                        )}
                      </Box>

                      {/* Product Meta + Actions */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "row", sm: "row" },
                          alignItems: "center",
                          justifyContent: {
                            xs: "space-between",
                            sm: "flex-end",
                          },
                          gap: 2,
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: { xs: "flex-start", sm: "flex-end" },
                            gap: 1,
                          }}
                        >
                          {product.quantity && (
                            <Chip
                              label={`Qtd: ${product.quantity}`}
                              color="info"
                              sx={{ fontWeight: "bold" }}
                              size="small"
                            />
                          )}
                          {product.addedAt && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              📅{" "}
                              {new Date(product.addedAt).toLocaleString(
                                "pt-BR",
                              )}
                            </Typography>
                          )}
                        </Box>

                        <Tooltip title="Remover produto deste local">
                          <IconButton
                            onClick={() => handleRemoveProduct(product)}
                            disabled={removingProduct === product.code}
                            color="error"
                            size="small"
                            sx={{
                              "&:hover": {
                                backgroundColor: "error.light",
                                color: "white",
                              },
                            }}
                          >
                            {removingProduct === product.code ? (
                              <CircularProgress size={20} color="error" />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>

              {/* Pagination */}
              <TablePagination
                component="div"
                count={products.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[
                  { value: 5, label: "5" },
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: -1, label: "Todos" },
                ]}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  rowsPerPage === -1
                    ? `Todos (${count})`
                    : `${from}–${to} de ${count}`
                }
              />
            </>
          )}
        </Box>
      </Dialog>

      <FeedbackSnackbar snackbar={snackbar} handleClose={handleCloseSnackbar} />
    </>
  );
}
