import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnlineGame from "./components/OnlineGame";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnlineGame />} />
        <Route path="/game" element={<OnlineGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 