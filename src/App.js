import React, { useState } from 'react';
import { ethers } from 'ethers';

// Replace with your contract ABI and address
const contractABI = [
		{
			"inputs": [],
			"stateMutability": "nonpayable",
			"type": "constructor"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "winner",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "amount",
					"type": "uint256"
				}
			],
			"name": "Jackpot",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "player",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "playerNumber",
					"type": "uint256"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "contractNumber",
					"type": "uint256"
				}
			],
			"name": "Played",
			"type": "event"
		},
		{
			"inputs": [],
			"name": "lastJackpotTimestamp",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "owner",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "playerNumber",
					"type": "uint256"
				}
			],
			"name": "play",
			"outputs": [],
			"stateMutability": "payable",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "playCost",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"name": "playersSinceLastJackpot",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [],
			"name": "withdraw",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"stateMutability": "payable",
			"type": "receive"
		}
	];
const contractAddress = '0xcad3fcd3eff63f44384f4ee79256b028eabffe46';

function App() {
    const [provider, setProvider] = useState(null);
    const [lotteryContract, setLotteryContract] = useState(null);
    const [playerNumber, setPlayerNumber] = useState('');
    const [message, setMessage] = useState('');
    const [gameResult, setGameResult] = useState(null);
	const [jackpotAmount, setJackpotAmount] = useState("0");

	const getJackpotAmount = async (currentProvider) => {
		if (!currentProvider) {
			console.error("Provider is not set");
			return;
		}
	
		try {
			const balanceInWei = await currentProvider.getBalance(contractAddress);
			const jackpotInWei = balanceInWei.div(2); // 50% of the balance
			const jackpotInEther = ethers.utils.formatEther(jackpotInWei);
			console.log(jackpotInEther);
			setJackpotAmount(jackpotInEther);
		} catch (error) {
			console.error("Error fetching contract balance:", error);
		}
	};
	
    // Function to connect to MetaMask wallet
	const connectWallet = async () => {
		if (window.ethereum) {
			try {
				await window.ethereum.request({ method: 'eth_requestAccounts' });
				const newProvider = new ethers.providers.Web3Provider(window.ethereum);
				setProvider(newProvider); // Set provider in state for later use
				const signer = newProvider.getSigner();
				const lotteryContract = new ethers.Contract(contractAddress, contractABI, signer);
				setLotteryContract(lotteryContract);
				setMessage('Wallet connected.');
	
				// Use 'newProvider' directly
				await getJackpotAmount(newProvider);
			} catch (error) {
				setMessage('Failed to connect wallet.');
				console.error(error);
			}
		} else {
			setMessage('MetaMask is not installed.');
		}
	};
	

    // Function to handle the number input change
    const handleNumberChange = (e) => {
        setPlayerNumber(e.target.value);
    };

	// Function to play the game
	const handlePlay = async () => {
		if (!lotteryContract) {
			setMessage('Please connect to your wallet first.');
			return;
		}

		try {
			const currentAddress = await provider.getSigner().getAddress();
			
			const playHandler = async (player, playerNumber, contractNumber) => {
				if (player.toLowerCase() === currentAddress.toLowerCase()) {
					setGameResult({ playerNumber, contractNumber });
					console.log(`Your Number: ${playerNumber}, Contract Number: ${contractNumber}`);
				}
			};

			// Detach any existing event listener
			lotteryContract.off("Played", playHandler);

			// Attach a new event listener
			lotteryContract.on("Played", playHandler);

			const tx = await lotteryContract.play(playerNumber, { value: ethers.utils.parseEther("0.001") });
			await tx.wait();

			setMessage(`Transaction successful. Hash: ${tx.hash}`);
		} catch (error) {
			console.error(error);
			setMessage('Transaction failed.');
		}
	};


    return (
        <div>
			<div>
    		Current Jackpot: {jackpotAmount.toString()} ETH
			</div>
            <button onClick={connectWallet}>Connect Wallet</button>
            <input type="number" value={playerNumber} onChange={handleNumberChange} placeholder="Enter a number (1-99)" />
            <button onClick={handlePlay}>Play</button>

            {message && <p>{message}</p>}

            {gameResult && (
                <div>
                    <p>Your Number: {gameResult.playerNumber.toString()}</p>
                    <p>Contract Number: {gameResult.contractNumber.toString()}</p>
                    <p>{gameResult.playerNumber === gameResult.contractNumber ? 'Congratulations! You won!' : 'Sorry, you did not win this time.'}</p>
                </div>
				
            )}
        </div>

    );
}

export default App;

