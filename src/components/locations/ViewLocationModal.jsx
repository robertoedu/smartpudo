import { useState } from "react";
import {
  Box,
  Modal,
  Fade,
  Backdrop,
  Typography,
  IconButton,
  Chip,
  Paper,
  TablePagination,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ViewLocationModal({ open, location, onClose }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleClose = () => {
    setPage(0);
    onClose();
  };

  const products = location?.products || [];
  const visibleProducts =
    rowsPerPage === -1
      ? products
      : products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: "85%", md: "70%", lg: "60%" },
            maxWidth: 900,
            maxHeight: "90vh",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: 4,
            boxShadow: 24,
            p: { xs: 3, sm: 4 },
            border: "2px solid",
            borderColor: "primary.main",
          }}
        >
          {location && (
            <>
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

              {products.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="h6" color="text.secondary">
                    📦 Nenhum produto armazenado neste local
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
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

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "row", sm: "column" },
                              alignItems: { xs: "center", sm: "flex-end" },
                              justifyContent: {
                                xs: "space-between",
                                sm: "flex-start",
                              },
                              gap: 1,
                              width: { xs: "100%", sm: "auto" },
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
                        </Box>
                      </Paper>
                    ))}
                  </Box>

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
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}
