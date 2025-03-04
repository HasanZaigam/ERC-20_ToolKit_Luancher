import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenv from "dotenv";

dotenv.config();

const OpenVestingModule = buildModule("OpenVestingModule", (m) => {
  const primaryTokenAddress = process.env.PRIMARY_TOKEN_ADDRESS;
  const secondaryTokenAddress = process.env.SECONDARY_TOKEN_ADDRESS;

  if (!primaryTokenAddress || !secondaryTokenAddress) {
    throw new Error("Primary or Secondary Token Address is missing in .env file");
  }

  const openVesting = m.contract("OpenVesting", [primaryTokenAddress, secondaryTokenAddress]);

  return { openVesting };
});

export default OpenVestingModule;
