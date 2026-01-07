import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JoinAuction from "./pages/JoinAuction";
import CreateAuction from "./pages/CreateAuction";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join" element={<JoinAuction />} />
        <Route path="/create" element={<CreateAuction />} />
      </Routes>
    </BrowserRouter>
  );
}