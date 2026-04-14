import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FeedbackSnackbar from "../components/FeedbackSnackbar";
import { useFeedback } from "../components/useFeedback";
import LocationCard from "../components/locations/LocationCard";
import LocationTable from "../components/locations/LocationTable";
import AddLocationModal from "../components/locations/AddLocationModal";
import ViewLocationModal from "../components/locations/ViewLocationModal";
import EditLocationModal from "../components/locations/EditLocationModal";
import DeleteLocationDialog from "../components/locations/DeleteLocationDialog";
import api from "../services/api";

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState(null);

  const { snackbar, handleClose, showSuccess, showError } = useFeedback();

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/locations");
      setLocations(data.locations || data || []);
    } catch (error) {
      console.error("Erro ao buscar locais:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenView = (location) => {
    setSelectedLocation(location);
    setViewModalOpen(true);
  };

  const handleCloseView = () => {
    setViewModalOpen(false);
    setTimeout(() => setSelectedLocation(null), 200);
  };

  const handleOpenEdit = (location) => {
    setEditingLocation(location);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditingLocation(null);
  };

  const handleOpenDelete = (location) => {
    setDeletingLocation(location);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingLocation(null);
  };

  return (
    <Box>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && locations.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            📭 Nenhum local cadastrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Clique no botão + para adicionar um novo local
          </Typography>
        </Box>
      )}

      {/* Mobile */}
      {!loading && locations.length > 0 && (
        <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 2, mt: 3 }}>
          {locations.map((location, index) => (
            <LocationCard
              key={index}
              location={location}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </Box>
      )}

      {/* Desktop */}
      {!loading && locations.length > 0 && (
        <LocationTable
          locations={locations}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      )}

      <Fab
        color="primary"
        aria-label="adicionar local"
        onClick={() => setAddModalOpen(true)}
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 64,
          height: 64,
          boxShadow: 6,
          "&:hover": { transform: "scale(1.1)", boxShadow: 12 },
          transition: "all 0.2s",
        }}
      >
        <AddIcon sx={{ fontSize: 32 }} />
      </Fab>

      <AddLocationModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={fetchLocations}
        showSuccess={showSuccess}
        showError={showError}
      />

      <ViewLocationModal
        open={viewModalOpen}
        location={selectedLocation}
        onClose={handleCloseView}
      />

      <EditLocationModal
        key={editingLocation?.code}
        open={editModalOpen}
        location={editingLocation}
        onClose={handleCloseEdit}
        onSaved={fetchLocations}
        showSuccess={showSuccess}
        showError={showError}
      />

      <DeleteLocationDialog
        open={deleteDialogOpen}
        location={deletingLocation}
        onClose={handleCloseDelete}
        onDeleted={fetchLocations}
        showSuccess={showSuccess}
        showError={showError}
      />

      <FeedbackSnackbar snackbar={snackbar} onClose={handleClose} />
    </Box>
  );
}
