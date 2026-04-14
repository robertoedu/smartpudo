import { useState } from "react";
import {
  Box,
  Paper,
  Button,
  Typography,
  Chip,
  Divider,
  IconButton,
  TextField,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";

export default function BatchProductList({ products, location, onSend, onRemove, onUpdate }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditingValue(products[index]);
  };

  const handleSaveEdit = (index) => {
    const value = editingValue.trim();
    if (value) onUpdate(index, value);
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  if (products.length === 0) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        startIcon={<SendIcon />}
        onClick={onSend}
        sx={{ mb: 2, py: 1.5, fontSize: "1.1rem", fontWeight: "bold" }}
      >
        Enviar Lote ({products.length} {products.length === 1 ? "produto" : "produtos"})
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Produtos no Lote</Typography>
        <Chip
          label={`${products.length} ${products.length === 1 ? "produto" : "produtos"}`}
          color="primary"
          size="small"
        />
      </Box>

      <Divider sx={{ mb: 1 }} />

      <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5, gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ width: 28 }}>
          #
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Código
        </Typography>
        <Box sx={{ width: 34 }} />
      </Box>

      <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
        {products.map((code, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              backgroundColor: index % 2 === 0 ? "rgba(144, 202, 249, 0.06)" : "transparent",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ width: 28, flexShrink: 0 }}>
              {index + 1}
            </Typography>

            {editingIndex === index ? (
              <TextField
                size="small"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit(index);
                  if (e.key === "Escape") handleCancelEdit();
                }}
                onBlur={() => handleSaveEdit(index)}
                autoFocus
                sx={{ flex: 1 }}
                inputProps={{ style: { fontWeight: "bold", fontSize: "0.875rem" } }}
              />
            ) : (
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ flex: 1, cursor: "pointer", py: 0.5 }}
                onClick={() => handleStartEdit(index)}
                title="Clique para editar"
              >
                {code}
              </Typography>
            )}

            <IconButton size="small" onClick={() => onRemove(index)} color="error" tabIndex={-1}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
