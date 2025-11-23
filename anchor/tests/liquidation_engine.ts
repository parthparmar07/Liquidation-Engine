import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LiquidationEngine } from "../target/types/liquidation_engine";
import { assert } from "chai";

describe("liquidation_engine", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LiquidationEngine as Program<LiquidationEngine>;

  let insuranceFund = anchor.web3.Keypair.generate();
  let position = anchor.web3.Keypair.generate();
  let liquidator = provider.wallet;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initializeInsuranceFund()
      .accounts({
        insuranceFund: insuranceFund.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([insuranceFund])
      .rpc();
    
    console.log("Your transaction signature", tx);

    const account = await program.account.insuranceFund.fetch(insuranceFund.publicKey);
    assert.equal(account.balance.toNumber(), 0);
  });

  // Note: In a real test we would need to initialize a Position account first.
  // Since we didn't create an 'initialize_position' instruction in the program for this demo,
  // we can't fully test the liquidation flow on-chain without it. 
  // However, this demonstrates the test structure.
});
