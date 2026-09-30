import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  Paper, Stack, TextField, Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import Barcode from "../components/Barcode";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

const pad = (value) => String(value).padStart(2, "0");
const toLocalInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
const initialStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return toLocalInput(date);
};
const formatDate = (value) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short",
}).format(new Date(value));

export default function ProductBarcodes() {
  const [startedAt, setStartedAt] = useState(initialStart);
  const [endedAt, setEndedAt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (event) => {
    event.preventDefault();
    setError("");
    if (!startedAt) return setError("Informe a data e a hora inicial.");
    if (endedAt && new Date(endedAt) < new Date(startedAt)) return setError("O fim do período deve ser posterior ao início.");
    setLoading(true);
    try {
      const payload = { startedAt: new Date(startedAt).toISOString() };
      if (endedAt) payload.endedAt = new Date(endedAt).toISOString();
      const { data } = await api.post("/api/products/barcodes/search", payload);
      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError.response?.data?.errors?.[0]?.message || requestError.response?.data?.message || "Não foi possível buscar os produtos.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStartedAt(initialStart()); setEndedAt(""); setResult(null); setError("");
  };

  return (
    <Box className="barcode-page">
      <Box className="no-print">
        <PageHeader title="Gerar códigos de barras" subtitle="Localize produtos pela data de entrada e prepare etiquetas legíveis para impressão." />
        <Paper component="form" onSubmit={search} variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
          <Stack spacing={2}>
            <Alert severity="info">Informe quando as entradas começaram. Se deixar o fim vazio, a busca irá até o momento atual.</Alert>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
              <TextField label="Início do período" type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} required fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Fim do período (opcional)" type="datetime-local" value={endedAt} onChange={(event) => setEndedAt(event.target.value)} fullWidth InputLabelProps={{ shrink: true }} helperText="Em branco: até agora" />
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="button" startIcon={<RestartAltIcon />} onClick={reset} disabled={loading}>Limpar</Button>
              <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <SearchIcon />} disabled={loading}>Buscar produtos</Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {result && (
        <Box>
          <Paper className="barcode-summary" variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="h6">{result.count} produto(s) encontrado(s)</Typography>
                <Typography variant="body2" color="text.secondary">De {formatDate(result.startedAt)} até {formatDate(result.endedAt)}</Typography>
              </Box>
              {result.count > 0 && <Button className="no-print" variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir etiquetas</Button>}
            </Stack>
          </Paper>

          {result.count === 0 ? (
            <Alert severity="warning">Nenhuma entrada de produto foi encontrada nesse período.</Alert>
          ) : (
            <Box className="barcode-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
              {result.products.map((product, index) => (
                <Card className="barcode-card" variant="outlined" key={product.code}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">PRODUTO {index + 1}</Typography>
                      {product.locationCode && <Chip size="small" label={`Local ${product.locationCode}`} />}
                    </Stack>
                    <Box sx={{ px: 0.5, py: 1, bgcolor: "common.white" }}><Barcode value={product.code} /></Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography className="barcode-value" align="center" variant="h6" sx={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>{product.code}</Typography>
                    <Typography align="center" variant="caption" color="text.secondary">Entrada: {formatDate(product.receivedAt)}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
