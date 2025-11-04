import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import ProposalLanding from "./Pages/ProposalLanding";
import Proposal from "./Pages/Proposal";
import Timeline from "./Pages/Timeline";
import HowWeWork from "./Pages/HowWeWork";

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<ProposalLanding />} />
      <Route path="/proposal" element={<Proposal />} />
      <Route path="/proposal/:engagementId" element={<Proposal />} />
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/how-we-work" element={<HowWeWork />} />
    </Routes>
  </Router>
);

export default App;
