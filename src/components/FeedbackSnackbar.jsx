import { Snackbar, Alert } from "@mui/material";

export default function FeedbackSnackbar({ snackbar, onClose }) {
  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: "100%", fontSize: "1rem", fontWeight: "bold" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
