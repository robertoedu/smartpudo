import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import PageHeader from '../components/PageHeader';
import api from '../services/api';

const marketplaces = { mercado_livre: 'Mercado Livre', shopee: 'Shopee', jadlog: 'Jadlog', jt: 'J&T', total_express: 'Total Express' };
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function formatEntry(value) {
  if (!value || Number.isNaN(Date.parse(value))) return 'Não disponível';
  return dateFormatter.format(new Date(value)).replace(',', '');
}

export default function RomaneioAudit() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const items = result?.items || [];

  async function search(event) {
    event.preventDefault();
    if (!start || (end && end < start)) {
      setError('Informe a data inicial e um período válido.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setPage(0);
    try {
      const { data } = await api.get('/api/romaneios/audit', { params: { start, end: end || undefined, marketplace: marketplace || undefined } });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Não foi possível consultar os romaneios.');
    } finally { setLoading(false); }
  }

  async function exportExcel() {
    setExporting(true);
    setError('');
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Auditoria', { views: [{ state: 'frozen', ySplit: 4 }] });
      sheet.columns = [{ width: 34 }, { width: 27 }, { width: 24 }];
      sheet.mergeCells('A1:C1');
      sheet.getCell('A1').value = 'Auditoria de romaneio';
      sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF17365D' } };
      sheet.getRow(1).height = 32;
      sheet.mergeCells('A2:C2');
      sheet.getCell('A2').value = `${result.filters.start.split('-').reverse().join('/')} a ${result.filters.end.split('-').reverse().join('/')} | ${marketplaces[result.filters.marketplace] || 'Todos os marketplaces'} | ${items.length} itens | Horário de Brasília`;
      sheet.getRow(2).height = 32;
      sheet.getCell('A2').alignment = { wrapText: true, vertical: 'middle' };
      sheet.addTable({ name: 'AuditoriaRomaneio', ref: 'A4', headerRow: true,
        style: { theme: 'TableStyleMedium2', showRowStripes: true },
        columns: [{ name: 'Código do item' }, { name: 'Entrada (dd/mm hh:mm:ss)' }, { name: 'Marketplace' }],
        rows: items.map(item => [String(item.code ?? ''), formatEntry(item.created_at), marketplaces[item.marketplace] || item.marketplace]) });
      sheet.getColumn(1).numFmt = '@';
      sheet.eachRow((row, number) => { if (number >= 4) { row.height = 23; row.alignment = { vertical: 'middle' }; } });
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `auditoria-romaneio_${result.filters.start}_${result.filters.end}.xlsx`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('Não foi possível exportar o Excel. Tente novamente.'); }
    finally { setExporting(false); }
  }

  const visible = size === -1 ? items : items.slice(page * size, (page + 1) * size);
  return <Box>
    <PageHeader title="Auditoria de romaneio" subtitle="Consulte os itens dos romaneios gerados por data operacional. Horários de entrada em Brasília." />
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack component="form" onSubmit={search} direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Data inicial" type="date" required value={start} onChange={e => setStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} disabled={loading} />
        <TextField label="Data final (opcional)" type="date" value={end} onChange={e => setEnd(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: start } }} disabled={loading} helperText="Sem data final: até hoje" />
        <TextField select label="Marketplace" value={marketplace} onChange={e => setMarketplace(e.target.value)} sx={{ minWidth: 200 }} disabled={loading}>
          <MenuItem value="">Todos</MenuItem>
          {Object.entries(marketplaces).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: { md: 'flex-start' }, minHeight: 56 }}>{loading ? 'Buscando…' : 'Buscar'}</Button>
      </Stack>
    </Paper>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ p: 2 }}>
        <Typography>{items.length} itens encontrados</Typography>
        <Button onClick={exportExcel} disabled={!items.length || loading || exporting} variant="outlined">{exporting ? 'Exportando…' : 'Exportar Excel'}</Button>
      </Stack>
      <TableContainer sx={{ maxHeight: 520, overflowY: 'auto', overflowX: 'hidden' }}>
        <Table stickyHeader size="small" aria-label="Itens dos romaneios" sx={{ tableLayout: 'fixed', '& th, & td': { overflowWrap: 'anywhere', px: { xs: 1, sm: 2 } } }}>
          <TableHead><TableRow><TableCell>Código do item</TableCell><TableCell>Entrada (dd/mm hh:mm:ss)</TableCell><TableCell>Marketplace</TableCell></TableRow></TableHead>
          <TableBody>
            {visible.map(item => <TableRow key={`${item.document_id}:${item.position}`} hover><TableCell sx={{ fontFamily: 'monospace' }}>{item.code}</TableCell><TableCell>{formatEntry(item.created_at)}</TableCell><TableCell>{marketplaces[item.marketplace] || item.marketplace}</TableCell></TableRow>)}
            {!visible.length && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 7 }}>
              {loading ? <CircularProgress size={28} aria-label="Consultando romaneios" /> : result ? 'Nenhum item encontrado para os filtros selecionados.' : 'Selecione a data inicial e clique em Buscar.'}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination component="div" count={items.length} page={page} rowsPerPage={size} rowsPerPageOptions={[10, 25, 50, 100, { label: 'Todos', value: -1 }]} labelRowsPerPage="Itens por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={e => { setSize(Number(e.target.value)); setPage(0); }} sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'flex-end', pl: 1 }, '& .MuiTablePagination-spacer': { display: 'none' } }} />
    </Paper>
    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>O Excel inclui todos os resultados da consulta. Documentos antigos podem não ter o horário de entrada disponível.</Typography>
  </Box>;
}
