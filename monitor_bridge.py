#!/usr/bin/env python3
"""Monitor Polymarket bridge status for address FKxyytNAYZRAZt86hgGQLmdShrgwtsLDxgSLdH9KRoT7"""

import json
import time
import urllib.request
from datetime import datetime

URL = "https://bridge.polymarket.com/status/FKxyytNAYZRAZt86hgGQLmdShrgwtsLDxgSLdH9KRoT7"
POLL_INTERVAL = 30
MAX_DURATION = 300  # 5 minutes

def check_bridge_status():
    """Poll bridge API for transaction status."""
    start_time = time.time()
    iteration = 0
    
    print(f"Starting bridge monitoring at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Address: FKxyytNAYZRAZt86hgGQLmdShrgwtsLDxgSLdH9KRoT7")
    print(f"Will check every {POLL_INTERVAL}s for up to {MAX_DURATION/60} minutes\n")
    
    while (time.time() - start_time) < MAX_DURATION:
        iteration += 1
        elapsed = time.time() - start_time
        print(f"[{iteration}] Checking at {datetime.now().strftime('%H:%M:%S')} (elapsed: {elapsed:.1f}s)...")
        
        try:
            req = urllib.request.Request(
                URL,
                headers={'Accept': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                transactions = data.get('transactions', [])
                print(f"    Found {len(transactions)} transaction(s)")
                
                if transactions:
                    for i, tx in enumerate(transactions):
                        status = tx.get('status', 'UNKNOWN')
                        tx_hash = tx.get('transactionHash', 'N/A')[:16] + '...' if tx.get('transactionHash') else 'N/A'
                        amount = tx.get('amount', 'N/A')
                        
                        print(f"    Tx #{i+1}: status={status}, hash={tx_hash}, amount={amount}")
                        
                        if status == "COMPLETED":
                            print(f"\n✓ SUCCESS: Found COMPLETED transaction!")
                            print(f"  Full transaction data:")
                            print(json.dumps(tx, indent=2))
                            return True, tx
                else:
                    print(f"    (no transactions yet)")
                    
        except Exception as e:
            print(f"    ERROR: {e}")
        
        # Check if time is up
        if (time.time() - start_time) >= MAX_DURATION:
            break
            
        # Wait before next poll
        time.sleep(POLL_INTERVAL)
    
    print(f"\n✗ TIMEOUT: No COMPLETED transaction found after {MAX_DURATION/60} minutes")
    return False, None

if __name__ == "__main__":
    found, tx_data = check_bridge_status()
    exit(0 if found else 1)
