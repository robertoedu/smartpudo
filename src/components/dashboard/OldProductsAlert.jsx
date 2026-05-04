import {
  Paper,
  Typography,
  Box,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  TablePagination,
} from "@mui/material";
import { useState } from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export default function OldProductsAlert({ products }) {
  const [expanded, setExpanded] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const value = event.target.value;
    setRowsPerPage(value === -1 ? products.length : parseInt(value, 10));
    setPage(0);
  };

  if (!products || products.length === 0) {
    return null;
  }

  const calculateDaysOld = (registeredAt) => {
    const now = new Date();
    const registered = new Date(registeredAt);
    const diffTime = Math.abs(now - registered);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 4,
        borderLeft: 4,
        borderColor: "warning.main",
        backgroundColor: "warning.lighter",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <WarningAmberIcon color="warning" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" color="warning.dark" fontWeight="bold">
              Produtos Pendentes de Devolução
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {products.length} {products.length === 1 ? "produto" : "produtos"}{" "}
              há 7 dias ou mais no estoque
            </Typography>
          </Box>
        </Box>
        <Chip
          label={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          color="warning"
          size="small"
        />
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Estes produtos estão há 7 dias ou mais no estoque e precisam ser
            devolvidos!
          </Alert>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Produto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Local</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Dias no Estoque</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Data de Entrada</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product, index) => {
                    const daysOld =
                      product.daysInLocation ||
                      calculateDaysOld(product.inDate);
                    const locationName = product.location?.name || "-";
                    const locationCode = product.location?.code || "";
                    const productCode = product.productCode || "Sem código";

                    return (
                      <TableRow
                        key={index}
                        sx={{
                          "&:hover": { backgroundColor: "warning.lighter" },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {productCode}
                          </Typography>
                          {locationCode && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Código: {locationCode}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {locationName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={
                              product.status === "IN"
                                ? "Em estoque"
                                : product.status
                            }
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${daysOld} dias`}
                            size="small"
                            color="warning"
                            icon={<WarningAmberIcon />}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {new Date(product.inDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 20, { value: -1, label: "Todos" }]}
            component="div"
            count={products.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Box>
      </Collapse>
    </Paper>
  );
}
