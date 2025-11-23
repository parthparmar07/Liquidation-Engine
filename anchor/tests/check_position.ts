import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LiquidationEngine } from "../target/types/liquidation_engine";

describe("check_position", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.LiquidationEngine as Program<LiquidationEngine>;

    it("Checks the position state!", async () => {
        const owner = provider.wallet;
        const symbol = "SOL/USD-9494";

        const [positionPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("position"),
                owner.publicKey.toBuffer(),
                Buffer.from(symbol)
            ],
            program.programId
        );

        console.log("Checking position at:", positionPda.toBase58());

        try {
            const account = await program.account.position.fetch(positionPda);
            console.log("--- Position State ---");
            console.log("Size:", account.size.toString());
            console.log("Collateral:", account.collateral.toString());
            console.log("Entry Price:", account.entryPrice.toString());

            if (account.size.toNumber() === 0) {
                console.log("STATUS: LIQUIDATED (Size is 0)");
            } else {
                console.log("STATUS: OPEN");
            }
        } catch (e) {
            console.log("Position not found (maybe closed/rent collected?)");
            console.log(e);
        }
    });
});
