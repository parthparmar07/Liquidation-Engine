// Realistic mock data for the liquidation engine dashboard (INR Values)

export const mockPositions = [
    {
        market: "SOL/USD-9494",
        userId: "7xK9...mP2a",
        healthFactor: 1.08,
        collateral: "₹10,45,800",
        liquidationPrice: "₹1,531",
        pubkey: "7xK9mP2a...",
        size: 850,
        entryPrice: 1806,
        actualCollateral: 1045800,
    },
    {
        market: "BTC/USD-3421",
        userId: "4nR5...8qL9",
        healthFactor: 1.15,
        collateral: "₹37,96,800",
        liquidationPrice: "₹35,15,400",
        pubkey: "4nR58qL9...",
        size: 1.2,
        entryPrice: 3738000,
        actualCollateral: 3796800,
    },
    {
        market: "ETH/USD-7856",
        userId: "2pM3...5vN7",
        healthFactor: 1.03,
        collateral: "₹24,27,600",
        liquidationPrice: "₹1,83,120",
        pubkey: "2pM35vN7...",
        size: 15.5,
        entryPrice: 197400,
        actualCollateral: 2427600,
    },
    {
        market: "SOL/USD-1234",
        userId: "9kT6...3wQ4",
        healthFactor: 1.42,
        collateral: "₹7,35,000",
        liquidationPrice: "₹1,503",
        pubkey: "9kT63wQ4...",
        size: 520,
        entryPrice: 1856,
        actualCollateral: 735000,
    },
    {
        market: "AVAX/USD-5678",
        userId: "5mL2...7pK8",
        healthFactor: 1.28,
        collateral: "₹13,10,400",
        liquidationPrice: "₹2,721",
        pubkey: "5mL27pK8...",
        size: 580,
        entryPrice: 3007,
        actualCollateral: 1310400,
    },
    {
        market: "BTC/USD-8901",
        userId: "3qN8...2rM5",
        healthFactor: 1.19,
        collateral: "₹56,53,200",
        liquidationPrice: "₹35,36,400",
        pubkey: "3qN82rM5...",
        size: 1.8,
        entryPrice: 3712800,
        actualCollateral: 5653200,
    },
    {
        market: "ETH/USD-2345",
        userId: "8vP4...6sT1",
        healthFactor: 1.52,
        collateral: "₹16,29,600",
        liquidationPrice: "₹1,80,600",
        pubkey: "8vP46sT1...",
        size: 10.2,
        entryPrice: 203280,
        actualCollateral: 1629600,
    },
    {
        market: "SOL/USD-6789",
        userId: "6wR7...4uV3",
        healthFactor: 1.11,
        collateral: "₹18,56,400",
        liquidationPrice: "₹1,554",
        pubkey: "6wR74uV3...",
        size: 1150,
        entryPrice: 1831,
        actualCollateral: 1856400,
    },
];

export const mockEvents = [
    {
        type: "liquidation" as const,
        timestamp: "3 mins ago",
        market: "SOL/USD",
        amount: "₹7,07,280",
        liquidator: "0xA7...3f",
    },
    {
        type: "warning" as const,
        timestamp: "8 mins ago",
        market: "ETH/USD",
        amount: "₹24,27,600",
    },
    {
        type: "liquidation" as const,
        timestamp: "12 mins ago",
        market: "BTC/USD",
        amount: "₹43,76,400",
        liquidator: "0x4B...9c",
    },
    {
        type: "risk_change" as const,
        timestamp: "18 mins ago",
        market: "AVAX/USD",
        amount: "₹13,10,400",
    },
    {
        type: "warning" as const,
        timestamp: "24 mins ago",
        market: "SOL/USD",
        amount: "₹10,45,800",
    },
    {
        type: "liquidation" as const,
        timestamp: "31 mins ago",
        market: "ETH/USD",
        amount: "₹16,29,600",
        liquidator: "0x8D...2a",
    },
    {
        type: "risk_change" as const,
        timestamp: "38 mins ago",
        market: "BTC/USD",
        amount: "₹56,53,200",
    },
    {
        type: "liquidation" as const,
        timestamp: "45 mins ago",
        market: "SOL/USD",
        amount: "₹18,56,400",
        liquidator: "0x2F...7e",
    },
];

export const mockTrendingTokens = [
    { symbol: "SOL", name: "Solana", price: "₹1,801", change: 8.3, volume: "₹35.2Cr" },
    { symbol: "BTC", name: "Bitcoin", price: "₹37,19,520", change: -1.2, volume: "₹157.1Cr" },
    { symbol: "ETH", name: "Ethereum", price: "₹2,00,340", change: 3.6, volume: "₹104.2Cr" },
    { symbol: "AVAX", name: "Avalanche", price: "₹2,950", change: 5.8, volume: "₹23.5Cr" },
    { symbol: "MATIC", name: "Polygon", price: "₹74.76", change: -2.1, volume: "₹12.6Cr" },
];

export const mockInsuranceFund = {
    balance: 439656000, // ₹43.96 Cr
    totalCovered: 11928000, // ₹1.19 Cr
    utilizationRatio: 2.7, // 2.7%
};

export const mockSystemStatus = {
    rpc: true,
    oracle: true,
    liquidator: true,
};
