import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { generateLeaf, getBigNumber } from "./helper";
import Generator from "./generator";
import { PrizeDistributor__factory } from "../typechain-types";

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
    await (await erc20Token.mint(prizeDistributor.address, totalPrize)).wait();
 
    const prize: Record<string, string> = {};
    prize[user1.address] = getBigNumber("100").toString();
    prize[user2.address] = getBigNumber("1000").toString();
    prize[user3.address] = getBigNumber("10000").toString();
    const generator = new Generator(prize)
    
    const { merkleRoot, merkleTree } = generator.generate()    

    return { erc20Token, prizeDistributor, owner, user1, user2, user3, prize, merkleRoot, merkleTree };
  }
  
  describe("Ownership", function () {

    it("should allow owner to set root", async function () {      
        const { erc20Token, prizeDistributor, owner, merkleRoot } = await loadFixture(deployPrizeDistributorFixture);
        await (await prizeDistributor.setMerkleRoot(merkleRoot)).wait()
        expect(await prizeDistributor.merkleRoot()).to.equal(merkleRoot);
    });

      it("should not allow (not owner) to set root", async function () {      
        const { erc20Token, prizeDistributor, user1, merkleRoot } = await loadFixture(deployPrizeDistributorFixture);
        await expect(prizeDistributor.connect(user1).setMerkleRoot(merkleRoot)).to.be.revertedWithCustomError(prizeDistributor, "EOnlyOwner")
    });

    it("should not allow owner to reset root", async function () {      
        const { erc20Token, prizeDistributor, owner, merkleRoot } = await loadFixture(deployPrizeDistributorFixture);
        await (await prizeDistributor.setMerkleRoot(merkleRoot)).wait()
        expect(await prizeDistributor.merkleRoot()).to.equal(merkleRoot);
        await expect(prizeDistributor.setMerkleRoot(merkleRoot)).to.be.revertedWithCustomError(prizeDistributor, "EMerkleRootSet")
    });
    
});
});
