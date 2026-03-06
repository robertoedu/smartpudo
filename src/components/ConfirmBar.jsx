import { Paper, Button, Box, Typography } from "@mui/material";

export default function ConfirmBar({
  text,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  disabled,
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        position: "sticky",
        bottom: 16,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          {text}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          {secondaryLabel && onSecondary && (
            <Button
              variant="outlined"
              onClick={onSecondary}
              disabled={disabled}
            >
              {secondaryLabel}
            </Button>
          )}
          <Button variant="contained" onClick={onPrimary} disabled={disabled}>
            {primaryLabel}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
