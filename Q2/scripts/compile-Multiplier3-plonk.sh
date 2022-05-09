#!/bin/bash

# [assignment] create your own bash script to compile Multipler3.circom using PLONK below

cd contracts/circuits

mkdir Multiplier3_plonk

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo "Downloading powerOfTau28_hez_final_10.ptau"
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

echo "Compiling Multiplier3.circom"

# compiling the circuit

circom Multiplier3.circom --r1cs --wasm --sym -o Multiplier3_plonk
snarkjs r1cs info Multiplier3_plonk/Multiplier3.r1cs

echo "Starting a new zkey"
# Start a new zkey and make a contribution

snarkjs plonk setup Multiplier3_plonk/Multiplier3.r1cs powersOfTau28_hez_final_10.ptau Multiplier3_plonk/Multiplier3.zkey
snarkjs zkey export verificationkey Multiplier3_plonk/Multiplier3.zkey Multiplier3_plonk/plonk_verification_key.json

echo "generating a solidity contract"
# generate solidity contract
snarkjs zkey export solidityverifier Multiplier3_plonk/Multiplier3.zkey ../plonk_Multiplier3Verifier.sol
echo "everything went well"
cd ../..