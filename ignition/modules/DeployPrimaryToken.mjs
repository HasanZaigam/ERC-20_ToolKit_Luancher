// const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// module.exports = buildModule("PrimaryTokenModule", (m) => {
//     const name = "PrimaryToken";
//     const symbol = "PTK";
//     const initialSupply = 1000000n; // ✅ Remove the 10^18 scaling

//     const primaryToken = m.contract("PrimaryToken", [name, symbol, initialSupply]);

//     return { primaryToken };
// });

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PrimaryTokenModule = buildModule("PrimaryTokenModule", (m) => {
  const name = m.getParameter("name", "MyToken");
  const symbol = m.getParameter("symbol", "MTK");
  const decimals = m.getParameter("decimals", 18);
  const initialSupply = m.getParameter("initialSupply", 1000000); // Default: 1 million tokens

  const primaryToken = m.contract("PrimaryToken", [name, symbol, decimals, initialSupply]);

  return { primaryToken };
});

export default PrimaryTokenModule;
