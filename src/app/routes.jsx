import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../components/PrivateRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Receive from "../pages/Receive";
import Withdraw from "../pages/Withdraw";
import Locations from "../pages/Locations";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/receber"
        element={
          <PrivateRoute>
            <Receive />
          </PrivateRoute>
        }
      />
      <Route
        path="/retirar"
        element={
          <PrivateRoute>
            <Withdraw />
          </PrivateRoute>
        }
      />
      <Route
        path="/locais"
        element={
          <PrivateRoute>
            <Locations />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
