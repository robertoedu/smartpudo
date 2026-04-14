import { Box, Paper, Typography, Chip, Divider } from "@mui/material";

export default function RecentReceiptsList({ items }) {
  if (items.length === 0) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Últimos Recebimentos</Typography>
        <Chip
          label={`${items.length} ${items.length === 1 ? "salvo" : "salvos"}`}
          color="success"
          size="small"
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
              borderRadius: 1,
              backgroundColor: "rgba(144, 202, 249, 0.08)",
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {item.product}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.location}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {item.timestamp}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
