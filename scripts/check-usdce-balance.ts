#!/usr/bin/env bun

/**
 * Check USDC.e Balance Directly on Polygon
 */

import { ethers } from "ethers";

const USDC_E_CONTRACT = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC.e on Polygon
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
  const walletAddress = "0x668706Ad919987Da5d273f6928F51d64235e09df";
  
  const contract = new ethers.Contract(USDC_E_CONTRACT, ABI, provider);
  
  try {
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    const formattedBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));
    
    console.log("=".repeat(60));
    console.log("USDC.e Balance Check");
    console.log("=".repeat(60));
    console.log("\n💼 Wallet:", walletAddress);
    console.log("💰 USDC.e Balance: $", formattedBalance.toFixed(2));
    
    if (formattedBalance > 0) {
      console.log("\n✅ Bridge completed successfully!");
      console.log("📍 Your 2 USDC from Solana has been converted to", formattedBalance.toFixed(2), "USDC.e on Polygon");
    } else {
      console.log("\n⏳ Bridge still processing...");
      console.log("📍 Check again in a few minutes");
    }
    console.log("=".repeat(60));
    
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

main();
