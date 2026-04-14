import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../services/api";

export default function DeleteLocationDialog({
  open,
  location,
  onClose,
  onDeleted,
  showSuccess,
  showError,
}) {
  const handleConfirm = async () => {
    try {
      await api.delete(`/api/locations/${location.code}`);
      showSuccess(`✅ Local ${location.code} excluído com sucesso!`);
      onClose();
      onDeleted();
    } catch (error) {
      console.error("Erro ao excluir local:", error);
      showError(error.response?.data?.message || "❌ Erro ao excluir local");
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: "2px solid",
          borderColor: "error.main",
        },
      }}
    >
      <DialogTitle sx={{ color: "error.main", fontWeight: "bold" }}>
        🗑️ Excluir Local
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tem certeza que deseja excluir o local{" "}
          <strong>{location?.code}</strong> — {location?.name}?
          {(location?.products?.length || 0) > 0 && (
            <>
              <br />
              <strong style={{ color: "#ef5350" }}>
                Atenção: este local possui {location.products.length} produto(s)
                armazenado(s).
              </strong>
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
        >
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
