import { Box, Paper, Typography, Chip, IconButton } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import InventoryIcon from "@mui/icons-material/Inventory";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function LocationCard({ location, onView, onEdit, onDelete }) {
  return (
    <Paper
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
      onClick={() => onView(location)}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <PlaceIcon color="primary" fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              Código
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            {location.code}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onView(location);
            }}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color="warning"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(location);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(location);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {location.name}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <InventoryIcon color="primary" fontSize="small" />
        <Chip
          label={`${location.products?.length || 0} produto${(location.products?.length || 0) !== 1 ? "s" : ""}`}
          color={(location.products?.length || 0) > 0 ? "primary" : "default"}
          size="small"
          sx={{ fontWeight: "bold" }}
        />
      </Box>
    </Paper>
  );
}
