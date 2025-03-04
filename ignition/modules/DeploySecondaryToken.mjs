import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const SecondaryTokenModule = buildModule("SecondaryTokenModule", (m) => {
  // Fetch the primary token address from the .env file
  const primaryTokenAddress = process.env.PRIMARY_TOKEN_ADDRESS;
  
  if (!primaryTokenAddress) {
    throw new Error("❌ PRIMARY_TOKEN_ADDRESS is not defined in .env file!");
  }

  // Define secondary token parameters
  const name = m.getParameter("name", "SecondaryToken");
  const symbol = m.getParameter("symbol", "STK");
  const initialSupply = m.getParameter("initialSupply", 500000);

  // Deploy the SecondaryToken contract
  const secondaryToken = m.contract("SecondaryToken", [
    name,
    symbol,
    primaryTokenAddress, // Use the stored PrimaryToken address
    initialSupply
  ]);

  return { secondaryToken }
});

export default SecondaryTokenModule;
