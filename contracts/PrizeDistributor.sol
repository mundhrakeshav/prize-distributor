// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { IPrizeDistributor } from "./IPrizeDistributor.sol";

contract PrizeDistributor is IPrizeDistributor {

    address public immutable owner;


    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;

    modifier OnlyOwner() {
        if (msg.sender != owner) {
            revert EOnlyOwner();
        }
        _;
    }

    constructor (address _owner) {
        owner = _owner;
    }


    function setMerkleRoot(bytes32 _merkleRoot) external OnlyOwner {
        if(merkleRoot != "") revert EMerkleRootSet(); // MerkleRoot can be set only once by owner
        merkleRoot = _merkleRoot;
    }
   
    function claim( address _account, address _token, uint256 _amount, bytes32[] calldata _proof) external {
        if (hasClaimed[_account]) revert EAlreadyClaimed(); // revert if address has already claimed tokens

        bytes32 _leaf = keccak256(abi.encodePacked(_account, _amount));
        bool isValidLeaf = verify(_proof, _leaf); // Verify merkle proof,
        if (!isValidLeaf) revert ENotInMerkle(); // Revert if not in tree
        hasClaimed[_account] = true;

        //If verified transfer _amount
        ERC20(_token).transfer(_account, _amount);
        emit Claimed(_amount, _account);
    }

    /*
    Returns true if "leaf" can be proved a part of tree.
    */
    function verify( bytes32[] calldata proof, bytes32 leaf) private view returns (bool isValid) {
        bytes32 computedRootHash = leaf;
        for (uint256 i = 0; i < proof.length; ) {
            //Update computed hash by hashing it with next element in tree
            computedRootHash = computedRootHash < proof[i] ? keccak256(abi.encode(computedRootHash, proof[i])) : keccak256(abi.encode(proof[i], computedRootHash));
            // computedRootHash = i % 2 != 0 ? keccak256(abi.encode(computedRootHash, proof[i])) : keccak256(abi.encode(proof[i], computedRootHash));
            unchecked {
                ++i;   
            }
        }
        return computedRootHash == merkleRoot; //Proof is valid only if rebuillt hash is equal to root
    }

}