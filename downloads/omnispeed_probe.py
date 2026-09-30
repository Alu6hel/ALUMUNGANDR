#!/usr/bin/env python3
# ==============================================================================
# OmniSpeed 24/7 Automated ISP Dispute & SLA Audit Probe
# Continuous background daemon for Raspberry Pi, Home Server, or Linux/macOS/Windows.
# Measures genuine line throughput and compiles unarguable regulatory evidence.
# ==============================================================================
import time
import urllib.request
import urllib.parse
import json
import os
import sys
import argparse
import datetime

DEFAULT_SERVER = "https://alumungandr.com"
CF_DOWN_URL = "https://speed.cloudflare.com/__down?bytes="
CF_UP_URL = "https://speed.cloudflare.com/__up"
LOG_FILE = "omnispeed_audit_log.csv"

def init_local_log():
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            f.write("Timestamp_ISO,ISP,Advertised_Mbps,Guaranteed_Mbps,Measured_Down_Mbps,Measured_Up_Mbps,Ping_ms,Jitter_ms,Deficit_Pct,SLA_Violation,Violation_Type,Daily_Rebate_Estimate\n")

def run_probe(server_url, advertised_mbps, monthly_bill, sla_threshold, isp_name):
    init_local_log()
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Probing network line quality...")
    
    # 1. Ping & Jitter
    pings = []
    ping_url = f"{server_url}/api/speedtest/ping?_={int(time.time()*1000)}"
    for _ in range(4):
        p_start = time.time()
        try:
            req = urllib.request.Request(ping_url, headers={"User-Agent": "OmniSpeed-CLI-Probe/2.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                resp.read()
            pings.append((time.time() - p_start) * 1000)
        except Exception:
            try:
                cf_req = urllib.request.Request("https://speed.cloudflare.com/__down?bytes=0", headers={"User-Agent": "OmniSpeed-CLI-Probe/2.0"})
                with urllib.request.urlopen(cf_req, timeout=4) as resp:
                    resp.read()
                pings.append((time.time() - p_start) * 1000)
            except Exception:
                pass
        time.sleep(0.05)
        
    best_ping = round(min(pings), 1) if pings else 999.0
    jitter = round(max(pings) - min(pings), 1) if len(pings) > 1 else 0.0

    # 2. Download Throughput
    down_url = f"{server_url}/api/speedtest/download?size=2097152&_={int(time.time()*1000)}"
    total_bytes = 0
    d_start = time.time()
    try:
        req = urllib.request.Request(down_url, headers={"User-Agent": "OmniSpeed-CLI-Probe/2.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if time.time() - d_start > 4.0:
                    break
    except Exception:
        try:
            d_start = time.time()
            total_bytes = 0
            req = urllib.request.Request(f"{CF_DOWN_URL}2097152", headers={"User-Agent": "OmniSpeed-CLI-Probe/2.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if time.time() - d_start > 4.0:
                        break
        except Exception as e:
            print(f"Download probe note: {e}")

    elapsed_down = max(0.001, time.time() - d_start)
    down_mbps = round((total_bytes * 8) / (elapsed_down * 1000000), 2)

    # 3. Upload Throughput
    up_mbps = 0.0
    up_url = f"{server_url}/api/speedtest/upload"
    payload = os.urandom(512 * 1024)
    u_start = time.time()
    try:
        req = urllib.request.Request(up_url, data=payload, headers={"Content-Type": "application/octet-stream", "User-Agent": "OmniSpeed-CLI-Probe/2.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            up_mbps = float(data.get("server_measured_mbps", 0.0))
    except Exception:
        try:
            u_start = time.time()
            req = urllib.request.Request(CF_UP_URL, data=payload, headers={"Content-Type": "application/octet-stream", "User-Agent": "OmniSpeed-CLI-Probe/2.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                resp.read()
            elapsed_up = max(0.001, time.time() - u_start)
            up_mbps = round((len(payload) * 8) / (elapsed_up * 1000000), 2)
        except Exception as e:
            print(f"Upload probe note: {e}")

    # SLA and Rebate Analysis
    guaranteed_mbps = round(advertised_mbps * (sla_threshold / 100.0), 2)
    deficit_pct = max(0.0, round(((advertised_mbps - down_mbps) / max(0.1, advertised_mbps)) * 100.0, 1))
    is_violation = down_mbps < guaranteed_mbps or best_ping > 180.0
    violation_type = "COMPLIANT"
    if down_mbps < (guaranteed_mbps * 0.4):
        violation_type = "SEVERE_THROTTLING"
    elif down_mbps < guaranteed_mbps:
        violation_type = "SLA_BREACH"
    elif best_ping > 180.0:
        violation_type = "EXCESSIVE_LATENCY"

    daily_rebate = round(min(monthly_bill / 30.0, (monthly_bill / 30.0) * (deficit_pct / 100.0)), 2)

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f'"{now_str}","{isp_name}",{advertised_mbps},{guaranteed_mbps},{down_mbps},{up_mbps},{best_ping},{jitter},{deficit_pct},"{is_violation}","{violation_type}",{daily_rebate}\n')

    print(f"  [PROBE] Down: {down_mbps} Mbps | Up: {up_mbps} Mbps | Ping: {best_ping}ms (Jitter: {jitter}ms)")
    print(f"  [STATUS] {violation_type} | Deficit: {deficit_pct}% | Daily Rebate Accrued: ${daily_rebate}")
    print(f"  [LEDGER] Appended record to {LOG_FILE}")

    try:
        record_payload = {
            "download_mbps": down_mbps,
            "upload_mbps": up_mbps,
            "ping_ms": best_ping,
            "jitter_ms": jitter,
            "advertised_mbps": advertised_mbps,
            "monthly_bill": monthly_bill,
            "sla_threshold_pct": sla_threshold,
            "probe_mode": "cli_background"
        }
        rec_req = urllib.request.Request(
            f"{server_url}/api/speedtest/record",
            data=json.dumps(record_payload).encode(),
            headers={"Content-Type": "application/json", "User-Agent": "OmniSpeed-CLI-Probe/2.0"}
        )
        with urllib.request.urlopen(rec_req, timeout=5) as resp:
            print(f"  [SYNC] Synced to server audit ledger.")
    except Exception:
        pass

def main():
    parser = argparse.ArgumentParser(description="OmniSpeed 24/7 Automated ISP Dispute & SLA Audit Probe")
    parser.add_argument("--server", default=DEFAULT_SERVER, help="OmniSpeed server URL")
    parser.add_argument("--interval", type=int, default=60, help="Probe interval in minutes (default: 60)")
    parser.add_argument("--advertised", type=float, default=100.0, help="Contracted advertised speed in Mbps")
    parser.add_argument("--bill", type=float, default=75.0, help="Monthly internet bill amount")
    parser.add_argument("--sla", type=float, default=80.0, help="Contract SLA guarantee threshold % (default: 80)")
    parser.add_argument("--isp", default="Broadband ISP", help="Carrier name")
    args = parser.parse_args()

    print("=" * 65)
    print("  OMNISPEED AUTOMATED ISP DISPUTE & SLA AUDIT PROBE")
    print(f"  Carrier: {args.isp} | Plan: {args.advertised} Mbps | SLA Min: {args.sla}%")
    print(f"  Probing interval: Every {args.interval} minutes")
    print(f"  Log file: {os.path.abspath(LOG_FILE)}")
    print("  Press Ctrl+C to stop.")
    print("=" * 65)

    while True:
        try:
            run_probe(args.server.rstrip("/"), args.advertised, args.bill, args.sla, args.isp)
        except Exception as e:
            print(f"Probe loop error: {e}")
        time.sleep(args.interval * 60)

if __name__ == "__main__":
    main()
