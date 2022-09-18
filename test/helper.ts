
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";

export function getBigNumber(amount: BigNumberish, decimals = 18): BigNumber {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals));
}

export function generateLeaf(address: string, value: string, token: string): Buffer {
  return Buffer.from(
    // Hash in appropriate format
    ethers.utils
      .solidityKeccak256(["address", "uint256", "address"], [address, value, token])
      .slice(2),
    "hex"
  );
}