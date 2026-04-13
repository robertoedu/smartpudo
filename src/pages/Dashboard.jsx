import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  LinearProgress,
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import PlaceIcon from "@mui/icons-material/Place";
import InventoryIcon from "@mui/icons-material/Inventory";
import StatCard from "../components/StatCard";
import api from "../services/api";

function getAvailabilityColor(count, capacity) {
  if (!capacity) return null;
  const ratio = count / capacity;
  if (ratio >= 0.8) return { bar: "#ef5350", label: "Cheio", chip: "error" };
  if (ratio >= 0.5)
    return { bar: "#ffa726", label: "Atenção", chip: "warning" };
  return { bar: "#66bb6a", label: "OK", chip: "success" };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStock: 0,
    receivedToday: 0,
    withdrawnToday: 0,
  });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/api/dashboard/stats");
        setStats(data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLocations = async () => {
      try {
        const { data } = await api.get("/api/locations");
        setLocations(data.locations || data || []);
      } catch (error) {
        console.error("Erro ao buscar locais:", error);
      } finally {
        setLocLoading(false);
      }
    };

    fetchStats();
    fetchLocations();
  }, []);

  return (
    <Box>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          gap: 2,
          flexDirection: "column",
          mb: 4,
        }}
      >
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<CallReceivedIcon />}
          onClick={() => navigate("/receber")}
        >
          Receber produto
        </Button>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          startIcon={<CallMadeIcon />}
          onClick={() => navigate("/retirar")}
        >
          Retirar produto
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 3,
          alignItems: { xs: "center", sm: "stretch" },
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              py: 4,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <StatCard
                label="Total em Estoque"
                value={(stats.totalIn || 0).toLocaleString("pt-BR")}
                hint="produtos"
              />
            </Box>
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <StatCard
                label="Recebidos Hoje"
                value={(stats.receivedToday || 0).toString()}
                hint="últimas 24h"
              />
            </Box>
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <StatCard
                label="Retirados Hoje"
                value={(stats.withdrawnToday || 0).toString()}
                hint="últimas 24h"
              />
            </Box>
          </>
        )}
      </Box>

      {/* Tabela de disponibilidade — somente desktop */}
      <Box sx={{ display: { xs: "none", md: "block" }, mt: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <PlaceIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Disponibilidade dos Locais
          </Typography>
        </Box>

        {locLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : locations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum local cadastrado.
          </Typography>
        ) : (
          (() => {
            const filteredLocations = locations.filter((loc) => {
              if (statusFilter === "all") return true;
              const count = loc.products?.length || 0;
              const cap = loc.capacity || null;
              const colors = getAvailabilityColor(count, cap);
              if (statusFilter === "none") return !colors;
              return colors?.label === statusFilter;
            });

            const paginatedLocations =
              rowsPerPage === -1
                ? filteredLocations
                : filteredLocations.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage,
                  );

            return (
              <>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
                >
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="OK">OK</MenuItem>
                      <MenuItem value="Atenção">Atenção</MenuItem>
                      <MenuItem value="Cheio">Cheio</MenuItem>
                      <MenuItem value="none">Sem limite</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer
                  component={Paper}
                  elevation={8}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(20px)",
                    maxHeight: 480,
                    overflow: "auto",
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow
                        sx={{ backgroundColor: "rgba(33, 150, 243, 0.15)" }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Código
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Nome
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
                            <InventoryIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle2" fontWeight="bold">
                              Produtos
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Ocupação
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="subtitle2" fontWeight="bold">
                            Status
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedLocations.map((loc, idx) => {
                        const count = loc.products?.length || 0;
                        const cap = loc.capacity || null;
                        const pct = cap
                          ? Math.min((count / cap) * 100, 100)
                          : null;
                        const colors = getAvailabilityColor(count, cap);

                        return (
                          <TableRow
                            key={idx}
                            hover
                            sx={{
                              "&:hover": {
                                backgroundColor: "rgba(33,150,243,0.08)",
                              },
                              transition: "background-color 0.2s",
                            }}
                          >
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color="primary.main"
                              >
                                {loc.code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {loc.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="bold">
                                {count}
                                {cap ? ` / ${cap}` : ""}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {cap ? (
                                <Tooltip title={`${Math.round(pct)}% ocupado`}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{
                                      height: 10,
                                      borderRadius: 5,
                                      backgroundColor: "rgba(255,255,255,0.1)",
                                      "& .MuiLinearProgress-bar": {
                                        backgroundColor: colors.bar,
                                        borderRadius: 5,
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Sem limite cadastrado
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {colors ? (
                                <Chip
                                  label={colors.label}
                                  color={colors.chip}
                                  size="small"
                                  sx={{ fontWeight: "bold", minWidth: 70 }}
                                />
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {paginatedLocations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 2 }}
                            >
                              Nenhum local encontrado para este filtro.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredLocations.length}
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
                    rowsPerPage === -1
                      ? `Todos (${count})`
                      : `${from}–${to} de ${count}`
                  }
                />
              </>
            );
          })()
        )}
      </Box>
    </Box>
  );
}
