import keccak256 from "keccak256"; // Keccak256 hashing
import MerkleTree from "merkletreejs"; // MerkleTree.js
import { getAddress, solidityKeccak256 } from "ethers/lib/utils"; // Ethers utils


type AirdropRecipient = {
  address: string; 
  value: string;
  token: string;
};

export default class Generator {
  recipients: AirdropRecipient[] = [];

  constructor(airdrop: Record<string, string>, token: string) {
    for (const [address, amount] of Object.entries(airdrop)) {
      this.recipients.push({
        address: getAddress(address),
        value: amount,
        token
      });
    }
  }

  generateLeaf(address: string, value: string, token: string): Buffer {
    return Buffer.from(solidityKeccak256(["address", "uint256", "address"], [address, value, token]).slice(2), "hex");
  }

  generate(): { merkleRoot: string, merkleTree: MerkleTree} {

    // Generate merkle tree
    const merkleTree = new MerkleTree(
      // Generate leafs
      this.recipients.map(({ address, value, token }) =>
        this.generateLeaf(address, value, token)
      ),
      keccak256,
      { sortPairs: true }
    );

    // Collect and return merkle root
    const merkleRoot: string = merkleTree.getHexRoot();
    return { merkleRoot, merkleTree }
  }
}

