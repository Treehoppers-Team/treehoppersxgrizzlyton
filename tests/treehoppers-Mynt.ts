import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TreehoppersMynt } from "../target/types/treehoppers_mynt";

describe("treehoppers-Mynt", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TreehoppersMynt as Program<TreehoppersMynt>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
