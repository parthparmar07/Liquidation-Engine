import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LiquidationEngine } from "../target/types/liquidation_engine";

describe("init_if", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.LiquidationEngine as Program<LiquidationEngine>;

    it("Initializes the Insurance Fund!", async () => {
        const authority = provider.wallet;

        // Derive the PDA for the Insurance Fund
        // We'll use a static seed "insurance_fund" for simplicity
        const [insuranceFundPda] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("insurance_fund")],
            program.programId
        );

        console.log("Initializing Insurance Fund at:", insuranceFundPda.toBase58());

        try {
            const tx = await program.methods
                .initializeInsuranceFund()
                .accounts({
                    insuranceFund: insuranceFundPda,
                    authority: authority.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();
            console.log("Transaction signature", tx);
        } catch (e) {
            console.log("Insurance Fund might already be initialized.");
            console.log(e);
        }

        // Verify
        const account = await program.account.insuranceFund.fetch(insuranceFundPda);
        console.log("Insurance Fund Balance:", account.balance.toString());
    });
});
