// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;
interface IPrizeDistributor {
   function setMerkleRoot(bytes32 _merkleRoot) external;
   function claim( address _account, address _token, uint256 _amount, bytes32[] calldata _proof) external;

   error EMerkleRootSet();
   error EOnlyOwner();
   error EAlreadyClaimed();
   error ENotInMerkle();

   event Claimed(uint, address);
}