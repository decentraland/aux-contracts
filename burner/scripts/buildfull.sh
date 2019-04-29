#! /bin/bash

BURNER=DecentralandBurner.sol

OUTPUT=full

npx truffle-flattener contracts/$BURNER > $OUTPUT/$BURNER