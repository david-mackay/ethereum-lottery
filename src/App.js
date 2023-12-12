import './App.css';

import React, { useState, useEffect, useCallback } from 'react';
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


function App() {
	const contractAddress = '0xcad3fcd3eff63f44384f4ee79256b028eabffe46';
    const [provider, setProvider] = useState(null);
    const [lotteryContract, setLotteryContract] = useState(null);
    const [playerNumber, setPlayerNumber] = useState('');
    const [message, setMessage] = useState('');
    const [gameResult, setGameResult] = useState(null);
	const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);
	const [displayNumber, setDisplayNumber] = useState("00");
	const [jackpotAmount, setJackpotAmount] = useState('0');



    // Function to connect to MetaMask wallet
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);
                const signer = provider.getSigner();
                const lotteryContract = new ethers.Contract(contractAddress, contractABI, signer);
                setLotteryContract(lotteryContract);
                setMessage('Wallet connected.');
            } catch (error) {
                setMessage('Failed to connect wallet.');
                console.error(error);
            }
        } else {
            setMessage('MetaMask is not installed.');
        }
    };

	const fetchAndUpdateJackpot = useCallback(async () => {
        if (provider && contractAddress) {
            try {
                const balance = await provider.getBalance(contractAddress);
                const jackpot = ethers.utils.formatEther(balance) / 2;
                setJackpotAmount(jackpot.toFixed(4)); // Displaying up to 4 decimal places
            } catch (error) {
                console.error('Error fetching contract balance:', error);
            }
        }
    }, [provider, contractAddress]); // Dependencies for useCallback

    useEffect(() => {
        fetchAndUpdateJackpot();
    }, [fetchAndUpdateJackpot]); // Dependency array includes the memoized function


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
			setIsTransactionInProgress(true);
        	numberAnimationInterval = startNumberAnimation();
			// Set up the listener before sending the transaction
			lotteryContract.on("Played", (player, playerNumber, contractNumber) => {
				provider.getSigner().getAddress().then(currentAddress => {
					if (player.toLowerCase() === currentAddress.toLowerCase()) {
						setGameResult({ playerNumber, contractNumber });
						setDisplayNumber(contractNumber.toString().padStart(2, '0')); // This line sets the displayed contract number
						setMessage(`Your Number: ${playerNumber}, Contract Number: ${contractNumber}`);
					}
				});
			});
	
			const tx = await lotteryContract.play(playerNumber, { value: ethers.utils.parseEther("0.001") });
			await tx.wait();
			setIsTransactionInProgress(false);
			fetchAndUpdateJackpot();
			clearInterval(numberAnimationInterval);
			setDisplayNumber(gameResult.contractNumber.toString().padStart(2, '0'));
			setMessage(`Transaction successful. Hash: ${tx.hash}`);
		} catch (error) {
			console.error(error)
			alert(error.reason);
			setMessage('Transaction failed.');
			setIsTransactionInProgress(false);
			clearInterval(numberAnimationInterval);
		}
	
	};

	const renderPlayButtonContent = () => {
        if (isTransactionInProgress) {
            return <div className="spinner"></div>; // Show spinner when transaction is in progress
        }
        return 'Play';
    };
	
	const startNumberAnimation = () => {
		return setInterval(() => {
			const randomNum = Math.floor(Math.random() * 99) + 1;
			setDisplayNumber(String(randomNum).padStart(2, '0'));
		}, 42); // Change number every 100ms
	};

	let numberAnimationInterval;

    return (
		<div className="app-container">
			<div>
            <p className="jackpot">Current Jackpot: {jackpotAmount}</p>
        </div>
        <div>
            <p className="contract-number">Contract Number: {displayNumber}</p>
        </div>
		<div className="button-container">
			<button onClick={connectWallet}>Connect Wallet</button>
		</div>
		<div className="input-container">
			<input type="number" value={playerNumber} onChange={handleNumberChange} placeholder="Enter a number (1-99)" />
		</div>
		<div className="button-container">
                <button 
                    onClick={handlePlay}
                    disabled={isTransactionInProgress}
                >
                    {renderPlayButtonContent()}
                </button>
            </div>
	
	    {message && <p>{message}</p>}

	    {gameResult && (
	        <div>
	            <p>Your Number: {gameResult.playerNumber.toString()}</p>
	            <p>Contract Number: {gameResult.contractNumber.toString()}</p>
	            <p>{gameResult.playerNumber === gameResult.contractNumber ? 'Congratulations! You won!' : 'Sorry, you did not win this time.'}</p>
        	</div>
    	)}

	    {isTransactionInProgress && <p>Processing transaction...</p>}
	    {/* Include more sophisticated animations here if needed */}
	</div>

    );
}

export default App;

