import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LiquidationEngine } from "../target/types/liquidation_engine";

describe("create_position", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.LiquidationEngine as Program<LiquidationEngine>;

    it("Opens a position!", async () => {
        const owner = provider.wallet;
        const symbol = "SOL/USD-" + Math.floor(Math.random() * 10000);

        // Derive the PDA for the position
        const [positionPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("position"),
                owner.publicKey.toBuffer(),
                Buffer.from(symbol)
            ],
            program.programId
        );

        console.log("Creating position at:", positionPda.toBase58());

        const size = new anchor.BN(100 * 1000000); // 100 units (6 decimals)
        const collateral = new anchor.BN(1000 * 1000000); // $1000 collateral
        const entryPrice = new anchor.BN(20 * 1000000); // $20 entry price
        const leverage = 2;

        const tx = await program.methods
            .openPosition(symbol, size, collateral, entryPrice, leverage)
            .accounts({
                position: positionPda,
                owner: owner.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Your transaction signature", tx);

        // Verify it was created
        const account = await program.account.position.fetch(positionPda);
        console.log("Position created successfully!");
        console.log("Owner:", account.owner.toBase58());
        console.log("Symbol:", account.symbol);
        console.log("Size:", account.size.toString());
    });
});
