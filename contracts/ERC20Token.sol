// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import { ERC20 } from "solmate/src/tokens/ERC20.sol";

contract ERC20Token is ERC20 {

    constructor() ERC20("Token Name", "Token Symbol", 18) {}

    //For testing
    function mint(address _to, uint _amount) external {
        _mint(_to, _amount);
    }

}