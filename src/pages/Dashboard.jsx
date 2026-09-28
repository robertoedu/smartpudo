import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, Box, CircularProgress, Typography, Alert, Snackbar } from "@mui/material";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import StatCard from "../components/dashboard/StatCard";
import DashboardLocationTable from "../components/dashboard/DashboardLocationTable";
import OldProductsAlert from "../components/dashboard/OldProductsAlert";
import InventoryReconciliationDialog from "../components/dashboard/InventoryReconciliationDialog";
import api from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStock: 0,
    receivedToday: 0,
    withdrawnToday: 0,
  });
  const [locations, setLocations] = useState([]);
  const [oldProducts, setOldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(true);
  const [oldProductsLoading, setOldProductsLoading] = useState(true);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const refreshDashboard = async () => {
    const [{ data: statsData }, { data: locationsData }, { data: oldProductsData }] = await Promise.all([
      api.get("/api/dashboard/stats"), api.get("/api/locations"), api.get("/api/locations/old-products"),
    ]);
    setStats(statsData);
    setLocations(locationsData.locations || locationsData || []);
    setOldProducts(oldProductsData.products || oldProductsData || []);
  };

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

    const fetchOldProducts = async () => {
      try {
        const { data } = await api.get("/api/locations/old-products");
        setOldProducts(data.products || data || []);
      } catch (error) {
        console.error("Erro ao buscar produtos antigos:", error);
      } finally {
        setOldProductsLoading(false);
      }
    };

    fetchStats();
    fetchLocations();
    fetchOldProducts();
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

      <Box sx={{ mt: 3 }}>
        <Alert
          severity="info"
          action={<Button color="inherit" size="small" startIcon={<FactCheckIcon />} onClick={() => setReconciliationOpen(true)}>Conferir agora</Button>}
        >
          O total parece incorreto? Compare o estoque com a lista atual de produtos aguardando retirada.
        </Alert>
      </Box>

      {/* Alerta de produtos antigos */}
      {!oldProductsLoading && oldProducts.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <OldProductsAlert products={oldProducts} />
        </Box>
      )}

      {/* Tabela de disponibilidade — somente desktop */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        {locLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4, mt: 5 }}>
            <CircularProgress size={28} />
          </Box>
        ) : locations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>
            Nenhum local cadastrado.
          </Typography>
        ) : (
          <DashboardLocationTable locations={locations} />
        )}
      </Box>

      <InventoryReconciliationDialog
        open={reconciliationOpen}
        onClose={() => setReconciliationOpen(false)}
        onCompleted={async (result) => {
          setSuccessMessage(`${result.removedCount} produto(s) foram marcados como entregues. Restam ${result.remainingCount} em estoque.`);
          try { await refreshDashboard(); } catch (error) { console.error("Erro ao atualizar dashboard:", error); }
        }}
      />
      <Snackbar open={Boolean(successMessage)} autoHideDuration={6000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage("")}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
}
