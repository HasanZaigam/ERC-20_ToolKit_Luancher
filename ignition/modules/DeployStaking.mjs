import { buildModule } from "@nomicfoundation/ignition-core";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const StakingModule = buildModule("StakingModule", (m) => {
  // Read Primary and Secondary token addresses from .env file
  const primaryToken = process.env.PRIMARY_TOKEN_ADDRESS;
  const secondaryToken = process.env.SECONDARY_TOKEN_ADDRESS;

  if (!primaryToken || !secondaryToken) {
    throw new Error("❌ PRIMARY_TOKEN_ADDRESS or SECONDARY_TOKEN_ADDRESS is missing in .env file");
  }

  console.log(`✅ Using PrimaryToken: ${primaryToken}`);
  console.log(`✅ Using SecondaryToken: ${secondaryToken}`);

  // Deploy StakingContract with the token addresses
  const stakingContract = m.contract("StakingContract", [primaryToken, secondaryToken]);

  return { stakingContract };
});

export default StakingModule;
