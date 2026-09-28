import { useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, LinearProgress, List, ListItem, ListItemText, Paper, Stack, TextField, Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import api from "../../services/api";
import { extractProductCodes, readInventoryFile } from "../../utils/inventoryDocument";

export default function InventoryReconciliationDialog({ open, onClose, onCompleted }) {
  const fileInputRef = useRef(null);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codes = extractProductCodes(content);

  const reset = () => {
    setContent(""); setFileName(""); setPreview(null); setError(""); setLoading(false);
  };

  const close = () => { reset(); onClose(); };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(""); setPreview(null);
    try {
      setContent(await readInventoryFile(file));
      setFileName(file.name);
    } catch (fileError) {
      setError(fileError.message);
    }
  };

  const analyze = async () => {
    if (!codes.length) return setError("Nenhum código de produto com 11 dígitos foi encontrado.");
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/api/products/reconciliation/preview", { productCodes: codes });
      setPreview(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Não foi possível analisar o estoque.");
    } finally { setLoading(false); }
  };

  const confirm = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/api/products/reconciliation", {
        productCodes: codes,
        inventoryFingerprint: preview.inventoryFingerprint,
      });
      onCompleted(data);
      close();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Não foi possível atualizar o estoque.");
      if (requestError.response?.status === 409) setPreview(null);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : close} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>Conferir estoque pela lista de retiradas</DialogTitle>
      {loading && <LinearProgress />}
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Cole ou importe a lista dos produtos que <strong>ainda estão no ponto de retirada</strong>.
          Após a análise, o sistema mostrará tudo que será marcado como entregue.
        </Alert>
        {!preview ? (
          <Stack spacing={2}>
            <TextField
              label="Cole a lista aqui"
              value={content}
              onChange={(event) => { setContent(event.target.value); setPreview(null); setFileName(""); }}
              placeholder={"68 unidades\n47997462325\nPick Up\n17 de set. 17:02"}
              multiline minRows={9} fullWidth disabled={loading}
              helperText={`${codes.length} código(s) único(s) identificado(s)`}
            />
            <Box>
              <input ref={fileInputRef} hidden type="file" accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFile} />
              <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} disabled={loading}>
                Importar TXT ou Word
              </Button>
              {fileName && <Chip label={fileName} sx={{ ml: 1 }} onDelete={() => { setContent(""); setFileName(""); }} />}
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Paper variant="outlined" sx={{ p: 2, flex: 1 }}><Typography variant="caption" color="text.secondary">ESTOQUE ATUAL</Typography><Typography variant="h5">{preview.currentStockCount}</Typography></Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1, borderColor: "success.main" }}><Typography variant="caption" color="text.secondary">PERMANECEM</Typography><Typography variant="h5" color="success.main">{preview.keptCount}</Typography></Paper>
              <Paper variant="outlined" sx={{ p: 2, flex: 1, borderColor: "warning.main" }}><Typography variant="caption" color="text.secondary">SERÃO RETIRADOS</Typography><Typography variant="h5" color="warning.main">{preview.removeCount}</Typography></Paper>
            </Stack>
            {preview.unknownCodes.length > 0 && <Alert severity="warning">{preview.unknownCodes.length} código(s) da lista não estão atualmente no estoque. Eles não serão alterados.</Alert>}
            {preview.removeCount > 0 ? <>
              <Alert severity="error" icon={<WarningAmberIcon />}>Esta ação marcará <strong>{preview.removeCount} produto(s)</strong> como entregues e removerá suas localizações atuais.</Alert>
              <Typography variant="subtitle2">Produtos que serão retirados</Typography>
              <Paper variant="outlined" sx={{ maxHeight: 230, overflow: "auto" }}><List dense disablePadding>{preview.productsToRemove.map((product, index) => <Box key={product.code}><ListItem><ListItemText primary={product.code} secondary={`Local: ${product.locationCode}`} /> </ListItem>{index < preview.productsToRemove.length - 1 && <Divider />}</Box>)}</List></Paper>
            </> : <Alert severity="success">A lista já corresponde ao estoque. Nenhum produto será retirado.</Alert>}
          </Stack>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={preview ? () => setPreview(null) : close} disabled={loading}>{preview ? "Voltar e corrigir" : "Cancelar"}</Button>
        {!preview ? <Button variant="contained" startIcon={<InventoryIcon />} onClick={analyze} disabled={loading || !codes.length}>Analisar lista</Button>
          : preview.removeCount > 0 && <Button variant="contained" color="error" onClick={confirm} disabled={loading}>Confirmar retirada de {preview.removeCount}</Button>}
      </DialogActions>
    </Dialog>
  );
}
