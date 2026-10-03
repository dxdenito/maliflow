import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import DashboardLayout from "./layouts/DashboardLayout";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SplashPage from "./pages/SplashPage";
import IncomePage from "./pages/IncomePage";
import ExpensesPage from "./pages/ExpensesPage";
import BudgetsPage from "./pages/BudgetsPage";
import SavingsPage from "./pages/SavingsPage";
import ObligationsPage from "./pages/ObligationsPage";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<SplashPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />


        <Route element={<ProtectedRoute />}>

          <Route element={<DashboardLayout />}>

            <Route path="/dashboard" element={<DashboardPage />}/>
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/obligations" element={<ObligationsPage />} />
            

          </Route>

        </Route>

      </Routes>

    </BrowserRouter>
  );
}


export default App;