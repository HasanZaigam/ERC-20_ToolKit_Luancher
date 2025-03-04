import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenv from "dotenv";

dotenv.config();

const WhitelistedVestingModule = buildModule("WhitelistedVestingModule", (m) => {
  // Fetch contract addresses from .env
  const primaryTokenAddress = m.getParameter("PRIMARY_TOKEN_ADDRESS", process.env.PRIMARY_TOKEN_ADDRESS);
  const secondaryTokenAddress = m.getParameter("SECONDARY_TOKEN_ADDRESS", process.env.SECONDARY_TOKEN_ADDRESS);

  // Deploy Whitelisted Vesting contract
  const whitelistedVesting = m.contract("WhitelistedVesting", [primaryTokenAddress, secondaryTokenAddress]);

  return { whitelistedVesting };
});

export default WhitelistedVestingModule;
