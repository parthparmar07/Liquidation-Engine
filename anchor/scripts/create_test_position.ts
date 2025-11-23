import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function createPosition() {
    // Set up provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const programId = new PublicKey("HCJaVaM9GEH4nYoX6UquxWXroXJyjSLp2LLKCa1gg5NJ");

    // Load IDL
    const idl = await Program.fetchIdl(programId, provider);
    const program = new Program(idl!, provider);

    // Generate random symbol
    const randomNum = Math.floor(Math.random() * 10000);
    const symbol = `SOL/USD-${randomNum}`;

    console.log(`Creating position with symbol: ${symbol}`);

    // Derive position PDA
    const [positionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("position"), provider.wallet.publicKey.toBuffer(), Buffer.from(symbol)],
        programId
    );

    try {
        const tx = await program.methods
            .openPosition(
                symbol,
                new anchor.BN(10_000_000), // 10 SOL size
                new anchor.BN(2_000_000),  // 2 SOL collateral
                new anchor.BN(9_000_000)   // $9 entry price
            )
            .accounts({
                position: positionPda,
                owner: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("✅ Position created!");
        console.log("Transaction:", tx);
        console.log("Position PDA:", positionPda.toBase58());
    } catch (error) {
        console.error("Error creating position:", error);
    }
}

createPosition();
