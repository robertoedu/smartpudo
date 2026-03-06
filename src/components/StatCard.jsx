import { Card, CardContent, Typography, Box } from "@mui/material";

export default function StatCard({ label, value, hint }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ textAlign: { xs: "center", sm: "left" } }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h3" component="div" sx={{ my: 2 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
