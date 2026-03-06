import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import TvIcon from "@mui/icons-material/Tv";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";
import AppRoutes from "../app/routes";

const drawerWidth = 280;

const menuItems = [
  { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { label: "Receber", path: "/receber", icon: <CallReceivedIcon /> },
  { label: "Retirar", path: "/retirar", icon: <CallMadeIcon /> },
  { label: "Locais", path: "/locais", icon: <PlaceIcon /> },
  {
    label: "Monitor",
    path: "/monitor",
    icon: <TvIcon />,
    newTab: true,
    desktopOnly: true,
  },
];

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path, newTab = false) => {
    if (newTab) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getCurrentTitle = () => {
    const currentItem = menuItems.find(
      (item) => item.path === location.pathname,
    );
    return currentItem ? currentItem.label : "smartpudo";
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          📦 smartpudo
        </Typography>
      </Toolbar>
      <List sx={{ px: 2 }}>
        {menuItems
          .filter((item) => !(item.desktopOnly && isMobile))
          .map((item) => (
            <ListItemButton
              key={item.path}
              selected={!item.newTab && location.pathname === item.path}
              onClick={() => handleNavigate(item.path, item.newTab)}
              sx={{
                borderRadius: 2,
                mb: 1,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "primary.contrastText",
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
      </List>
    </Box>
  );

  // Se não estiver autenticado, apenas mostra as rotas (login)
  if (!isAuthenticated) {
    return <AppRoutes />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getCurrentTitle()}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Olá, <strong>{user?.name || user?.username}</strong>
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              Sair
            </Button>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ display: { xs: "flex", sm: "none" } }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: "100%",
          minWidth: 0,
        }}
      >
        <Toolbar />
        <AppRoutes />
      </Box>
    </Box>
  );
}
