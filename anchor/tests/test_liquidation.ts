import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LiquidationEngine } from "../target/types/liquidation_engine";

describe("test_liquidation", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.LiquidationEngine as Program<LiquidationEngine>;

    it("Tries to liquidate full!", async () => {
        const owner = provider.wallet;
        const symbol = "SOL/USD-TEST";

        const [positionPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("position"), owner.publicKey.toBuffer(), Buffer.from(symbol)],
            program.programId
        );

        const [insuranceFundPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("insurance_fund")],
            program.programId
        );

        // 1. Create Position
        try {
            const size = new anchor.BN(100 * 1000000);
            const collateral = new anchor.BN(1000 * 1000000);
            const entryPrice = new anchor.BN(20 * 1000000);
            const leverage = 2;

            await program.methods
                .openPosition(symbol, size, collateral, entryPrice, leverage)
                .accounts({
                    position: positionPda,
                    owner: owner.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();
            console.log("Test Position Created");
        } catch (e) {
            console.log("Position might already exist");
        }

        // 2. Liquidate Full
        console.log("Attempting Liquidate Full...");
        try {
            const tx = await program.methods
                .liquidateFull()
                .accounts({
                    position: positionPda,
                    insuranceFund: insuranceFundPda,
                    liquidator: owner.publicKey,
                })
                .rpc();
            console.log("Liquidation Success! Sig:", tx);
        } catch (e) {
            console.error("Liquidation Failed:", e);
        }
    });
});
