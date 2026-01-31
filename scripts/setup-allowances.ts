import { ethers } from "ethers";
import { ClobClient, getContractConfig } from "@polymarket/clob-client";

// ABIs for contract interactions
const usdcAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const ctfAbi = [
    "function setApprovalForAll(address operator, bool approved) external",
    "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

// Contract addresses (Regular + NegRisk)
const NEG_RISK_CTF_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a";
const NEG_RISK_ADAPTER = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296";

/**
 * Check current allowances (before setting them)
 */
async function checkAllowances(privateKey: string, rpcUrl: string): Promise<boolean> {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractConfig = getContractConfig(137);
    
    console.log("\n🔍 CHECKING CURRENT ALLOWANCES\n");
    console.log("=".repeat(50));
    console.log("Wallet:", wallet.address, "\n");
    
    const usdcContract = new ethers.Contract(
        contractConfig.collateral,
        usdcAbi,
        wallet
    );
    
    const ctfContract = new ethers.Contract(
        contractConfig.conditionalTokens,
        ctfAbi,
        wallet
    );
    
    // Check USDC allowances
    console.log("📊 USDC Allowances:");
    const usdcRegularExchange = await usdcContract.allowance(wallet.address, contractConfig.exchange);
    const usdcNegRiskAdapter = await usdcContract.allowance(wallet.address, NEG_RISK_ADAPTER);
    const usdcNegRiskExchange = await usdcContract.allowance(wallet.address, NEG_RISK_CTF_EXCHANGE);
    
    console.log(`  Regular Exchange: ${usdcRegularExchange.gt(0) ? "✅ Approved" : "❌ Not approved"}`);
    console.log(`  NegRisk Adapter: ${usdcNegRiskAdapter.gt(0) ? "✅ Approved" : "❌ Not approved"}`);
    console.log(`  NegRisk Exchange: ${usdcNegRiskExchange.gt(0) ? "✅ Approved" : "❌ Not approved"}`);
    
    // Check CTF approvals
    console.log("\n📊 CTF (Conditional Token) Approvals:");
    const ctfRegularExchange = await ctfContract.isApprovedForAll(wallet.address, contractConfig.exchange);
    const ctfNegRiskExchange = await ctfContract.isApprovedForAll(wallet.address, NEG_RISK_CTF_EXCHANGE);
    
    console.log(`  Regular Exchange: ${ctfRegularExchange ? "✅ Approved" : "❌ Not approved"}`);
    console.log(`  NegRisk Exchange: ${ctfNegRiskExchange ? "✅ Approved" : "❌ Not approved"}`);
    
    console.log("\n" + "=".repeat(50));
    
    const allApproved = 
        usdcRegularExchange.gt(0) &&
        usdcNegRiskAdapter.gt(0) &&
        usdcNegRiskExchange.gt(0) &&
        ctfRegularExchange &&
        ctfNegRiskExchange;
    
    if (allApproved) {
        console.log("✅ ALL ALLOWANCES ARE SET! Ready to trade.");
        console.log("=".repeat(50) + "\n");
        return true;
    } else {
        console.log("⚠️  SOME ALLOWANCES MISSING - Setting them now...");
        console.log("=".repeat(50) + "\n");
        return false;
    }
}

/**
 * Setup ALL trading allowances (Regular + NegRisk)
 * This approves 5 contracts needed for trading on Polymarket
 */
async function setupAllTradingAllowances(privateKey: string, rpcUrl: string): Promise<{
    success: boolean;
    message: string;
    transactions: string[];
}> {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractConfig = getContractConfig(137);
    
    console.log("\n🔧 SETTING UP ALL TRADING ALLOWANCES\n");
    console.log("=".repeat(50));
    console.log("Wallet:", wallet.address);
    console.log("\n⚠️  This will approve BOTH regular AND negRisk markets\n");
    console.log("NOTE: Rewards are distributed automatically to your address.");
    console.log("      No separate 'rewards approval' is needed.\n");

    try {
        // Check balance first
        const balance = await provider.getBalance(wallet.address);
        const balanceFormatted = ethers.utils.formatEther(balance);
        const minRequired = ethers.utils.parseEther("0.5");
        if (balance.lt(minRequired)) {
            throw new Error(
                `❌ Insufficient MATIC for gas fees.\n` +
                `Current balance: ${balanceFormatted} MATIC\n` +
                `Minimum required: 0.5 MATIC\n` +
                `Please deposit MATIC to continue.`
            );
        }

        const feeData = await provider.getFeeData();
        const baseFee = feeData.lastBaseFeePerGas || ethers.utils.parseUnits("30", "gwei");
        
        const maxPriorityFeePerGas = ethers.utils.parseUnits("50", "gwei");
        const maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);
        
        const gasOptions = {
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            maxFeePerGas: maxFeePerGas,
            gasLimit: 100000,
        };

        console.log("💰 Gas Settings:");
        console.log("   Priority Fee:", ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei"), "Gwei");
        console.log("   Max Fee:", ethers.utils.formatUnits(maxFeePerGas, "gwei"), "Gwei");
        console.log("   Estimated Total Cost: ~$1-2 in MATIC\n");

        const usdcContract = new ethers.Contract(
            contractConfig.collateral,
            usdcAbi,
            wallet
        );

        const ctfContract = new ethers.Contract(
            contractConfig.conditionalTokens,
            ctfAbi,
            wallet
        );

        const transactions: string[] = [];

        // 1. Approve USDC for Regular Exchange
        console.log("1️⃣  Approving USDC for Regular Exchange...");
        let tx1 = await usdcContract.approve(
            contractConfig.exchange,
            ethers.constants.MaxUint256,
            gasOptions
        );
        console.log("   ✅ Transaction broadcasted:", tx1.hash);
        console.log("   ⏳ Waiting for confirmation...");
        await tx1.wait(1);
        console.log("   ✅ Regular Exchange USDC approval confirmed!\n");
        transactions.push("https://polygonscan.com/tx/" + tx1.hash);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Approve CTF for Regular Exchange
        console.log("2️⃣  Approving CTF tokens for Regular Exchange...");
        let tx2 = await ctfContract.setApprovalForAll(
            contractConfig.exchange,
            true,
            gasOptions
        );
        console.log("   ✅ Transaction broadcasted:", tx2.hash);
        console.log("   ⏳ Waiting for confirmation...");
        await tx2.wait(1);
        console.log("   ✅ Regular Exchange CTF approval confirmed!\n");
        transactions.push("https://polygonscan.com/tx/" + tx2.hash);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 3. Approve USDC for NegRisk Adapter
        console.log("3️⃣  Approving USDC for NegRisk Adapter...");
        let tx3 = await usdcContract.approve(
            NEG_RISK_ADAPTER,
            ethers.constants.MaxUint256,
            gasOptions
        );
        console.log("   ✅ Transaction broadcasted:", tx3.hash);
        console.log("   ⏳ Waiting for confirmation...");
        await tx3.wait(1);
        console.log("   ✅ NegRisk Adapter USDC approval confirmed!\n");
        transactions.push("https://polygonscan.com/tx/" + tx3.hash);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 4. Approve USDC for NegRisk Exchange
        console.log("4️⃣  Approving USDC for NegRisk Exchange...");
        let tx4 = await usdcContract.approve(
            NEG_RISK_CTF_EXCHANGE,
            ethers.constants.MaxUint256,
            gasOptions
        );
        console.log("   ✅ Transaction broadcasted:", tx4.hash);
        console.log("   ⏳ Waiting for confirmation...");
        await tx4.wait(1);
        console.log("   ✅ NegRisk Exchange USDC approval confirmed!\n");
        transactions.push("https://polygonscan.com/tx/" + tx4.hash);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 5. Approve CTF for NegRisk Exchange
        console.log("5️⃣  Approving CTF tokens for NegRisk Exchange...");
        let tx5 = await ctfContract.setApprovalForAll(
            NEG_RISK_CTF_EXCHANGE,
            true,
            gasOptions
        );
        console.log("   ✅ Transaction broadcasted:", tx5.hash);
        console.log("   ⏳ Waiting for confirmation...");
        await tx5.wait(1);
        console.log("   ✅ NegRisk Exchange CTF approval confirmed!\n");
        transactions.push("https://polygonscan.com/tx/" + tx5.hash);
        
        console.log("\n" + "=".repeat(50));
        console.log("🎉 ALL 5 APPROVALS CONFIRMED!");
        console.log("=".repeat(50));
        console.log("✅ Regular Markets: READY");
        console.log("✅ NegRisk Markets: READY");
        console.log("✅ Rewards: Auto-distributed to your wallet");
        console.log("=".repeat(50));
        console.log("\n📜 Transactions:");
        transactions.forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx}`);
        });
        
        return {
            success: true,
            message: "All allowances confirmed - ready for ALL market types!",
            transactions
        };
        
    } catch (error: any) {
        console.error("\n❌ ERROR:", error.message);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log("\n" + "=".repeat(50));
    console.log("🔐 POLYMARKET CONTRACT APPROVAL SETUP");
    console.log("=".repeat(50));
    
    // Load environment variables
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const POLYGON_RPC = process.env.POLYGON_RPC || "https://polygon-rpc.com";
    
    if (!PRIVATE_KEY) {
        throw new Error("❌ PRIVATE_KEY not found in .env file");
    }
    
    console.log("\n📍 Using RPC:", POLYGON_RPC);
    console.log("\n⚠️  IMPORTANT:");
    console.log("   This script will approve 5 contracts for trading:");
    console.log("   1. USDC → Regular Exchange");
    console.log("   2. CTF → Regular Exchange");
    console.log("   3. USDC → NegRisk Adapter");
    console.log("   4. USDC → NegRisk Exchange");
    console.log("   5. CTF → NegRisk Exchange");
    console.log("\n   Cost: ~$1-2 in MATIC for gas fees");
    console.log("   Required MATIC: Minimum 0.5 MATIC in wallet\n");
    
    try {
        // Check current allowances
        const allApproved = await checkAllowances(PRIVATE_KEY, POLYGON_RPC);
        
        if (allApproved) {
            console.log("✅ All approvals already set! No action needed.");
            console.log("   You can start trading immediately.\n");
            return;
        }
        
        // Setup allowances if not all approved
        console.log("⚠️  Setting up missing approvals...");
        console.log("   This will cost ~$1-2 in MATIC for gas.");
        console.log("   Starting in 5 seconds... (Ctrl+C to cancel)\n");
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const result = await setupAllTradingAllowances(PRIVATE_KEY, POLYGON_RPC);
        
        console.log("\n" + "=".repeat(50));
        console.log("✅ SETUP COMPLETE!");
        console.log("=".repeat(50));
        console.log("\nYou can now:");
        console.log("  • Trade on regular markets");
        console.log("  • Trade on negRisk markets");
        console.log("  • Earn liquidity rewards (auto-distributed)");
        console.log("\nNext step: Run a trading command!");
        console.log("  Example: bun run scripts/buy.ts --token \"...\" --price 0.50 --size 100\n");
        
    } catch (error: any) {
        console.error("\n❌ Setup failed:", error.message);
        process.exit(1);
    }
}

// Export functions for use in other scripts
export {
    checkAllowances,
    setupAllTradingAllowances
};

// Run if executed directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
