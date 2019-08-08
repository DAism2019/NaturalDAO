pragma solidity ^0.4.24;
contract NameFilter {
    function filter(string _input) public pure returns(bool){
        bytes memory _temp = bytes(_input);
        uint _length = _temp.length;
        for (uint i=0; i<_length;i++ ){
            //A-Z
            bool flag1 = _temp[i] >= 0x41 && _temp[i] <= 0x5a;
            //a-z
            bool flag2 = _temp[i] >= 0x61 && _temp[i] <= 0x7a;
            if(!flag1 && !flag2){
                return false;
            }
        }
        return true;
    }
}
