import { useState } from "react";
import {
  Box,
  Button,
  Modal,
  Fade,
  Backdrop,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ScanInput from "../ScanInput";
import api from "../../services/api";

export default function EditLocationModal({ open, location, onClose, onSaved, showSuccess, showError }) {
  const [editName, setEditName] = useState(location?.name || "");
  const [editCapacity, setEditCapacity] = useState(location?.capacity ? String(location.capacity) : "");

  const handleClose = () => {
    setEditName("");
    setEditCapacity("");
    onClose();
  };

  const handleSave = async () => {
    try {
      const payload = { name: editName };
      if (editCapacity && Number(editCapacity) > 0) {
        payload.capacity = Number(editCapacity);
      }
      await api.put(`/api/locations/${location.code}`, payload);
      showSuccess("✅ Local atualizado com sucesso!");
      handleClose();
      onSaved();
    } catch (error) {
      console.error("Erro ao editar local:", error);
      showError(error.response?.data?.message || "❌ Erro ao atualizar local");
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { timeout: 500, sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" } },
      }}
    >
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
            borderColor: "warning.main",
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
              color="warning.main"
              sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              ✏️ Editar Local — {location?.code}
            </Typography>
            <IconButton
              onClick={handleClose}
              sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ScanInput
              label="Nome do Local"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Prateleira A / Nível 3"
              autoFocus
              helperText="Descrição amigável do local"
            />

            <TextField
              fullWidth
              label="Capacidade máxima (opcional)"
              value={editCapacity}
              onChange={(e) => setEditCapacity(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 50"
              helperText="Deixe vazio para remover o limite"
              inputProps={{ inputMode: "numeric" }}
              variant="outlined"
            />

            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!editName.trim()}
            >
              Salvar alterações
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
