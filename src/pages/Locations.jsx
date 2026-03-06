import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  CircularProgress,
  Modal,
  Fade,
  Backdrop,
  Fab,
  TextField,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlaceIcon from "@mui/icons-material/Place";
import InventoryIcon from "@mui/icons-material/Inventory";
import ScanInput from "../components/ScanInput";
import FeedbackSnackbar from "../components/FeedbackSnackbar";
import { useFeedback } from "../components/useFeedback";
import api from "../services/api";

export default function Locations() {
  const [locationCode, setLocationCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationCapacity, setLocationCapacity] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { snackbar, handleClose, showSuccess, showError } = useFeedback();

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/locations");
      setLocations(data.locations || data || []);
    } catch (error) {
      console.error("Erro ao buscar locais:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSave = async () => {
    try {
      const payload = { code: locationCode, name: locationName };
      if (locationCapacity && Number(locationCapacity) > 0) {
        payload.capacity = Number(locationCapacity);
      }
      await api.post("/api/locations", payload);
      showSuccess("\u2705 Local salvo com sucesso!");
      setLocationCode("");
      setLocationName("");
      setLocationCapacity("");
      setAddModalOpen(false);
      fetchLocations();
    } catch (error) {
      console.error("Erro ao salvar local:", error);
      if (error.response?.status === 409) {
        showError("❌ Local com este código já existe");
      } else {
        showError("❌ Erro ao salvar local");
      }
    }
  };

  const handleOpenViewModal = (location) => {
    setSelectedLocation(location);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setTimeout(() => setSelectedLocation(null), 200);
  };

  const handleOpenAddModal = () => {
    setLocationCode("");
    setLocationName("");
    setLocationCapacity("");
    setAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    setLocationCode("");
    setLocationName("");
    setLocationCapacity("");
  };

  return (
    <Box>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && locations.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            📭 Nenhum local cadastrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Clique no botão + para adicionar um novo local
          </Typography>
        </Box>
      )}

      {/* Visualização Mobile - Cards */}
      {!loading && locations.length > 0 && (
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            gap: 2,
            mt: 3,
          }}
        >
          {locations.map((location, index) => (
            <Paper
              key={index}
              elevation={8}
              sx={{
                p: 3,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                borderRadius: 3,
                border: "1px solid rgba(33, 150, 243, 0.3)",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(33, 150, 243, 0.1)",
                  transform: "translateY(-2px)",
                  boxShadow: 12,
                },
              }}
              onClick={() => handleOpenViewModal(location)}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <PlaceIcon color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Código
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    {location.code}
                  </Typography>
                </Box>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenViewModal(location);
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {location.name}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InventoryIcon color="primary" fontSize="small" />
                <Chip
                  label={`${location.products?.length || 0} produto${(location.products?.length || 0) !== 1 ? "s" : ""}`}
                  color={
                    (location.products?.length || 0) > 0 ? "primary" : "default"
                  }
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Visualização Desktop - Tabela */}
      {!loading && locations.length > 0 && (
        <TableContainer
          component={Paper}
          elevation={8}
          sx={{
            display: { xs: "none", md: "block" },
            mt: 3,
            borderRadius: 3,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: "rgba(33, 150, 243, 0.15)",
                }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PlaceIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Código
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Nome do Local
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      justifyContent: "center",
                    }}
                  >
                    <InventoryIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Produtos
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {" "}
                    Disponibilidade
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {" "}
                    Ações
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "rgba(33, 150, 243, 0.08)",
                    },
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => handleOpenViewModal(location)}
                >
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {location.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {location.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={location.products?.length || 0}
                      color={
                        (location.products?.length || 0) > 0
                          ? "primary"
                          : "default"
                      }
                      size="small"
                      sx={{ fontWeight: "bold", minWidth: 50 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 140 }}>
                    {location.capacity ? (
                      <Tooltip
                        title={`${location.products?.length || 0} / ${location.capacity} produtos`}
                      >
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              ((location.products?.length || 0) /
                                location.capacity) *
                                100,
                              100,
                            )}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "rgba(255,255,255,0.1)",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  (location.products?.length || 0) /
                                    location.capacity >=
                                  0.8
                                    ? "#ef5350"
                                    : (location.products?.length || 0) /
                                          location.capacity >=
                                        0.5
                                      ? "#ffa726"
                                      : "#66bb6a",
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {location.products?.length || 0}/{location.capacity}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {location.products?.length || 0} (sem limite)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewModal(location);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Botão Flutuante de Adicionar */}
      <Fab
        color="primary"
        aria-label="adicionar local"
        onClick={handleOpenAddModal}
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 64,
          height: 64,
          boxShadow: 6,
          "&:hover": {
            transform: "scale(1.1)",
            boxShadow: 12,
          },
          transition: "all 0.2s",
        }}
      >
        <AddIcon sx={{ fontSize: 32 }} />
      </Fab>

      {/* Modal de Adicionar Local */}
      <Modal
        open={addModalOpen}
        onClose={handleCloseAddModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
          },
        }}
      >
        <Fade in={addModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "95%", sm: "500px" },
              bgcolor: "background.paper",
              borderRadius: 4,
              boxShadow: 24,
              p: { xs: 3, sm: 4 },
              border: "2px solid",
              borderColor: "primary.main",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                color="primary.main"
                sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
              >
                ➕ Adicionar Novo Local
              </Typography>
              <IconButton
                onClick={handleCloseAddModal}
                sx={{
                  color: "text.secondary",
                  "&:hover": { color: "error.main" },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <ScanInput
                label="Código do Local"
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                placeholder="A01-03"
                autoFocus
                helperText="Código identificador do local"
              />

              <ScanInput
                label="Nome do Local"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Prateleira A / Nível 3"
                helperText="Descrição amigável do local"
              />

              <TextField
                fullWidth
                label="Capacidade máxima (opcional)"
                value={locationCapacity}
                onChange={(e) =>
                  setLocationCapacity(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Ex: 50"
                helperText="Quantidade máxima de produtos neste local"
                inputProps={{ inputMode: "numeric" }}
                variant="outlined"
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={!locationCode.trim() || !locationName.trim()}
                  sx={{ flex: 1 }}
                >
                  Salvar local
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Modal de Visualizar Produtos */}
      <Modal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
          },
        }}
      >
        <Fade in={viewModalOpen}>
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
            {selectedLocation && (
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
                      📍 {selectedLocation.code}
                    </Typography>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                    >
                      {selectedLocation.name}
                    </Typography>
                    <Chip
                      label={`${selectedLocation.products?.length || 0} produto${(selectedLocation.products?.length || 0) !== 1 ? "s" : ""}`}
                      color="primary"
                      sx={{ mt: 2, fontWeight: "bold" }}
                      size="medium"
                    />
                  </Box>
                  <IconButton
                    onClick={handleCloseViewModal}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: "divider", my: 3 }} />

                {!selectedLocation.products ||
                selectedLocation.products.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography variant="h6" color="text.secondary">
                      📦 Nenhum produto armazenado neste local
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {selectedLocation.products.map((product, productIndex) => (
                      <Paper
                        key={productIndex}
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
                )}
              </>
            )}
          </Box>
        </Fade>
      </Modal>

      <FeedbackSnackbar snackbar={snackbar} onClose={handleClose} />
    </Box>
  );
}
