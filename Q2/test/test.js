const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16 } = require("snarkjs");
const {plonk} = require("snarkjs");
const { verify } = require("crypto");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        // here proof and publicSignals are gotten from the  fullProve method inside groth16 and we pass in test inputs for our circuit
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        // here we want to print in the console the first publicSignals
        console.log('1x2 =',publicSignals[0]);
 
        // here we perform some conversions like converting our publicSignals and proof and finally send over our converted data into the exportSolidityCallData method inside the groth16
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);

        // her we make use of the argv present for us in other to be able to pass input through the cmd
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
    
        // here we pick out our test input and output with the argv taled about above
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8); // here we take and use the slice method to take in the first 8 inputs

        // heree we define what our expected result should be
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;
    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const {proof, publicSignals} = await groth16.fullProve({"in1":"1","in2":"2","in3":"3"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        console.log('1x2x3 =', publicSignals[0]);

        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);

        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        const in1 = [argv[0], argv[1]];
        const in2 = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const in3 = [argv[6], argv[7]];
        const out = [argv[8]];
        const Input = argv.slice(9);

        expect(await verifier.verifyProof(in1, in2, in3, out, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let in1 = [0,0];
        let in2 = [[0,0],[0,0]];
        let in3 = [0,0];
        let out = [0];

        expect(await verifier.verifyProof(in1, in2, in3, out)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("plonk_Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const {proof, publicSignals} = await plonk.fullProve({"in1":"1","in2":"2","in3":"3"},"/contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","/contracts/circuits/Multiplier3_plonk/Multiplier3.zkey")
        
        console.log('1x2x3 = ',publicSignals[0]);

        var plonkText = fs.readFileSync("/contracts/circuits/Multiplier3_plonk/call.txt", 'utf-8');
        var plonkData = plonkText.split(',');

        expect(await verifier.verifyProof(plonkData[0], JSON.parse(plonkData[1]))).to.be.true;
    }); 
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let in1 = [0,0];
        let in2 = [[0,0],[0,0]];
        let in3 = [0,0];
        let out = [0];

        expect(await verifier.verifyProof(in1, in2, in3, out, input)).to.be.false;
    });
});