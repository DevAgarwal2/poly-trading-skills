# VERIFICATION CHECKLIST FOR AI ASSISTANTS

When a user asks to verify their Polymarket trading setup, follow this EXACT process:

## ✅ Step 1: Check Balance & Profile

Run this command:
```bash
bun run scripts/check-balance.ts
```

This will show:
- Wallet address
- Polymarket profile link
- MATIC balance (need > 1 MATIC)
- USDC.e balance (need ≥ $5)

## ✅ Step 2: Verify Contract Approvals

Run this command:
```bash
bun run scripts/setup-allowances.ts
```

**IMPORTANT**: This is the ONLY approval script to use!

### Expected Output (Fully Verified):
```
📊 USDC Allowances:
  Regular Exchange: ✅ Approved
  NegRisk Adapter: ✅ Approved
  NegRisk Exchange: ✅ Approved

📊 CTF (Conditional Token) Approvals:
  Regular Exchange: ✅ Approved
  NegRisk Exchange: ✅ Approved

✅ ALL ALLOWANCES ARE SET! Ready to trade.
```

If you see **ALL 5 ✅ checkmarks**, the user is **FULLY VERIFIED** and ready to trade.

## ⚠️ DO NOT USE THESE SCRIPTS (DELETED):
- ❌ check-approvals-only.ts (DELETED - was outdated)
- ❌ approve-regular.ts (DELETED - was incomplete)
- ❌ approve-regular-speedup.ts (DELETED - was incomplete)
- ❌ setup-approvals.ts (DELETED - was outdated)

## ✅ ONLY Use These Scripts:
1. `check-balance.ts` - Check balance and get profile link
2. `setup-allowances.ts` - Check AND set all 5 approvals
3. `check-creds.ts` - Generate API credentials

## User Verification Response Template:

```
✅ VERIFICATION STATUS:

Wallet: 0x...
Profile: https://polymarket.com/profile/0x...

✅ MATIC: X.XX (sufficient for gas)
✅ USDC.e: $X.XX
✅ API Credentials: Working
✅ Contract Approvals: ALL 5 APPROVED
  - Regular Exchange (USDC + CTF): ✅
  - NegRisk Adapter (USDC): ✅
  - NegRisk Exchange (USDC + CTF): ✅

🚀 YOU ARE FULLY VERIFIED AND READY TO TRADE!

You can trade on:
- ✅ Regular markets
- ✅ NegRisk markets
```

## Common Mistakes to Avoid:
1. ❌ Don't check old approval scripts
2. ❌ Don't say user needs approvals if setup-allowances.ts shows all ✅
3. ❌ Don't confuse "allowance" (old system) with "approvals" (current system)
4. ✅ Always run setup-allowances.ts to get current status
5. ✅ Trust the output from setup-allowances.ts - it's the source of truth
