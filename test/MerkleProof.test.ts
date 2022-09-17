import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { generateLeaf, getBigNumber } from "./helper";
import Generator from "./generator";

describe("Merkle Proof", function () {
  const totalPrize = getBigNumber("100000");
  async function deployPrizeDistributorFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    const erc20Token = await ERC20Token.deploy();
    await erc20Token.deployed();
    
    const PrizeDistributor = await ethers.getContractFactory("PrizeDistributor");
    const prizeDistributor = await PrizeDistributor.deploy(owner.address);
    await prizeDistributor.deployed();

    await (await erc20Token.mint(prizeDistributor.address, totalPrize)).wait(); // Mint token to PrizeDistributor
 
    // Create Prize
    const prize: Record<string, string> = {};
    prize[user1.address] = getBigNumber("100").toString();
    prize[user2.address] = getBigNumber("1000").toString();
    prize[user3.address] = getBigNumber("10000").toString();


    const generator = new Generator(prize)
    const { merkleRoot, merkleTree } = generator.generate();
    await (await prizeDistributor.setMerkleRoot(merkleRoot)).wait()

    return { erc20Token, prizeDistributor, owner, user1, user2, user3, prize, merkleRoot, merkleTree };
  }
  
  describe("Claiming", function () {

    it("Should set up.", async function () {
      const { erc20Token, prizeDistributor, owner } = await loadFixture(deployPrizeDistributorFixture);
      expect(await prizeDistributor.owner()).to.equal(owner.address);
      expect(await erc20Token.balanceOf(prizeDistributor.address)).to.equal(totalPrize);
    });

    it("User should be able to claim.", async function () {
      const { erc20Token, prizeDistributor, user1, prize, merkleTree } = await loadFixture(deployPrizeDistributorFixture);      
      const leaf = generateLeaf(user1.address, prize[user1.address])      
      const proof: string[] = merkleTree.getHexProof(leaf);
      await (await prizeDistributor.claim(user1.address, erc20Token.address, prize[user1.address], proof)).wait();
      expect(await erc20Token.balanceOf(user1.address)).to.equal(prize[user1.address]);
      expect(await erc20Token.balanceOf(prizeDistributor.address)).to.equal(totalPrize.sub(prize[user1.address]));
    });

    it("User should be able to claim only once.", async function () {
      const { erc20Token, prizeDistributor, user1, prize, merkleTree } = await loadFixture(deployPrizeDistributorFixture);      
      const leaf = generateLeaf(user1.address, prize[user1.address])      
      const proof: string[] = merkleTree.getHexProof(leaf);
      await (await prizeDistributor.claim(user1.address, erc20Token.address, prize[user1.address], proof)).wait();
      expect(await erc20Token.balanceOf(user1.address)).to.equal(prize[user1.address]);
      expect(await erc20Token.balanceOf(prizeDistributor.address)).to.equal(totalPrize.sub(prize[user1.address]));
      await expect(prizeDistributor.claim(user1.address, erc20Token.address, prize[user1.address], proof)).to.be.revertedWithCustomError(prizeDistributor, "EAlreadyClaimed");
    });

    it("User shouldn't be able to claim if proof incorrect.", async function () {
      const { erc20Token, prizeDistributor, user1, user2, prize, merkleTree } = await loadFixture(deployPrizeDistributorFixture);      
      const leaf = generateLeaf(user1.address, prize[user2.address]) //! Incorrect Amt      
      const proof: string[] = merkleTree.getHexProof(leaf);
      await expect(prizeDistributor.claim(user1.address, erc20Token.address, prize[user1.address], proof)).to.be.revertedWithCustomError(prizeDistributor, "ENotInMerkle");
    });
  });

});
