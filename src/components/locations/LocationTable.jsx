import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Typography,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import InventoryIcon from "@mui/icons-material/Inventory";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function LocationTable({ locations, onView, onEdit, onDelete }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const visibleLocations =
    rowsPerPage === -1
      ? locations
      : locations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={8}
        sx={{
          display: { xs: "none", md: "block" },
          mt: 3,
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          maxHeight: 520,
          overflow: "auto",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(33, 150, 243, 0.15)" }}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PlaceIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Código
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1" fontWeight="bold">
                  Nome do Local
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    justifyContent: "center",
                  }}
                >
                  <InventoryIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Produtos
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  Disponibilidade
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  Ações
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleLocations.map((location, index) => {
              const count = location.products?.length || 0;
              const ratio = location.capacity
                ? count / location.capacity
                : null;
              const barColor =
                ratio === null
                  ? null
                  : ratio >= 0.8
                    ? "#ef5350"
                    : ratio >= 0.5
                      ? "#ffa726"
                      : "#66bb6a";

              return (
                <TableRow
                  key={index}
                  hover
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(33, 150, 243, 0.08)" },
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => onView(location)}
                >
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="primary.main"
                    >
                      {location.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {location.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={count}
                      color={count > 0 ? "primary" : "default"}
                      size="small"
                      sx={{ fontWeight: "bold", minWidth: 50 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 140 }}>
                    {location.capacity ? (
                      <Tooltip
                        title={`${count} / ${location.capacity} produtos`}
                      >
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              (count / location.capacity) * 100,
                              100,
                            )}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "rgba(255,255,255,0.1)",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: barColor,
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {count}/{location.capacity}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {count} (sem limite)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        justifyContent: "center",
                      }}
                    >
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={locations.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[
          { value: 5, label: "5" },
          { value: 10, label: "10" },
          { value: 50, label: "50" },
          { value: -1, label: "Todos" },
        ]}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          rowsPerPage === -1 ? `Todos (${count})` : `${from}–${to} de ${count}`
        }
      />
    </>
  );
}
