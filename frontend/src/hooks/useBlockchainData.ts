"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { useEffect, useState } from "react";

const PROGRAM_ID = new PublicKey("HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ");

interface Position {
    market: string;
    userId: string;
    healthFactor: number;
    collateral: string;
    liquidationPrice: string;
    pubkey: string;
    size: number;
    entryPrice: number;
    actualCollateral: number;
}

export function usePositions() {
    const { connection } = useConnection();
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                setLoading(true);

                // Fetch all program accounts
                const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                    filters: [
                        {
                            dataSize: 168, // Size of Position account (adjust based on your struct)
                        },
                    ],
                });

                const parsedPositions: Position[] = [];

                for (const account of accounts) {
                    try {
                        const data = account.account.data;

                        // Skip if it's the insurance fund (discriminator check)
                        const discriminator = data.slice(0, 8);
                        const insuranceFundDiscriminator = Buffer.from([
                            0x3d, 0x06, 0x4b, 0x6e, 0x8c, 0x8a, 0x4e, 0x5c
                        ]);

                        if (discriminator.equals(insuranceFundDiscriminator)) {
                            continue;
                        }

                        // Parse position data (simplified - adjust based on your actual struct)
                        const owner = new PublicKey(data.slice(8, 40));
                        const size = Number(data.readBigUInt64LE(40)) / 1_000_000;
                        const collateral = Number(data.readBigUInt64LE(48)) / 1_000_000;
                        const entryPrice = Number(data.readBigUInt64LE(56)) / 1_000_000;

                        // Get symbol (assuming it's stored after the numbers)
                        let symbol = "";
                        try {
                            const symbolBytes = data.slice(64, 96);
                            symbol = symbolBytes.toString('utf8').replace(/\0/g, '');
                        } catch {
                            symbol = "UNKNOWN";
                        }

                        if (size === 0) continue; // Skip closed positions

                        // Calculate health factor (mock oracle price for now)
                        const mockPrice = 9.0; // This should come from your oracle
                        const positionValue = size * mockPrice;
                        const leverage = positionValue / collateral;
                        const pnl = (mockPrice - entryPrice) * size;
                        const equity = collateral + pnl;
                        const healthFactor = equity / (positionValue * 0.025); // 2.5% maintenance margin

                        parsedPositions.push({
                            market: symbol || "SOL/USD",
                            userId: owner.toBase58().slice(0, 4) + "..." + owner.toBase58().slice(-4),
                            healthFactor: healthFactor,
                            collateral: `$${collateral.toLocaleString()}`,
                            liquidationPrice: `$${(entryPrice * 0.95).toFixed(2)}`,
                            pubkey: account.pubkey.toBase58(),
                            size: size,
                            entryPrice: entryPrice,
                            actualCollateral: collateral,
                        });
                    } catch (err) {
                        console.error("Error parsing position:", err);
                    }
                }

                setPositions(parsedPositions);
            } catch (error) {
                console.error("Error fetching positions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPositions();

        // Refresh every 5 seconds
        const interval = setInterval(fetchPositions, 5000);
        return () => clearInterval(interval);
    }, [connection]);

    return { positions, loading };
}

export function useInsuranceFund() {
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsuranceFund = async () => {
            try {
                const [insuranceFundPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from("insurance_fund")],
                    PROGRAM_ID
                );

                const accountInfo = await connection.getAccountInfo(insuranceFundPda);

                if (accountInfo) {
                    // Parse balance (adjust based on your struct)
                    const data = accountInfo.data;
                    const balance = Number(data.readBigUInt64LE(8)) / 1_000_000;
                    setBalance(balance);
                }
            } catch (error) {
                console.error("Error fetching insurance fund:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsuranceFund();
        const interval = setInterval(fetchInsuranceFund, 10000);
        return () => clearInterval(interval);
    }, [connection]);

    return { balance, loading };
}

export function useSystemStatus() {
    const { connection } = useConnection();
    const [status, setStatus] = useState({
        rpc: false,
        oracle: false,
        liquidator: false,
    });

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Check RPC
                const slot = await connection.getSlot();
                const rpcOnline = slot > 0;

                // Check if backend is running (try to fetch from localhost:3001 or wherever your backend exposes data)
                let backendOnline = false;
                try {
                    const response = await fetch("http://localhost:3001/health", {
                        method: "GET",
                        signal: AbortSignal.timeout(2000)
                    });
                    backendOnline = response.ok;
                } catch {
                    backendOnline = false;
                }

                setStatus({
                    rpc: rpcOnline,
                    oracle: backendOnline, // Oracle is part of backend
                    liquidator: backendOnline, // Liquidator is part of backend
                });
            } catch (error) {
                console.error("Error checking system status:", error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [connection]);

    return status;
}
