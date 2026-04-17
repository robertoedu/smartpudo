import { useState } from "react";
import {
  Box,
  Button,
  Modal,
  Fade,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ScanInput from "../ScanInput";
import api from "../../services/api";

export default function AddLocationModal({
  open,
  onClose,
  onSaved,
  showSuccess,
  showError,
}) {
  const [locationCode, setLocationCode] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationCapacity, setLocationCapacity] = useState("");

  const handleClose = () => {
    setLocationCode("");
    setLocationName("");
    setLocationCapacity("");
    onClose();
  };

  const handleSave = async () => {
    try {
      const payload = { code: locationCode, name: locationName };
      if (locationCapacity && Number(locationCapacity) > 0) {
        payload.capacity = Number(locationCapacity);
      }
      await api.post("/api/locations", payload);
      showSuccess("✅ Local salvo com sucesso!");
      handleClose();
      onSaved();
    } catch (error) {
      console.error("Erro ao salvar local:", error);
      if (error.response?.status === 409) {
        showError("❌ Local com este código já existe");
      } else {
        showError("❌ Erro ao salvar local");
      }
    }
  };

  return (
    <Modal open={open} onClose={handleClose} closeAfterTransition>
      <Fade in={open}>
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
              onClick={handleClose}
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

            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!locationCode.trim() || !locationName.trim()}
            >
              Salvar local
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
