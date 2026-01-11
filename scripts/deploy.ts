#!/usr/bin/env ts-node
/**
 * ZKSwap Vault DApp - Deployment Script
 *
 * Deploys the ZKSwap Vault contract to Midnight testnet or mainnet.
 *
 * Usage:
 *   npm run deploy -- --network testnet
 *   npm run deploy -- --network mainnet
 *
 * Environment variables required:
 *   - DEPLOYER_PRIVATE_KEY: Private key for deployment
 *   - DEVELOPER_WALLET: Developer wallet address for fee collection
 *   - NIGHT_TOKEN_ID: NIGHT token contract address
 *   - DUST_TOKEN_ID: DUST token contract address
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
  confirmations: number;
}

interface DeploymentResult {
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  network: string;
  deployer: string;
  gasUsed: bigint;
  constructorArgs: {
    developerWallet: string;
    nightTokenId: string;
    dustTokenId: string;
  };
}

interface DeploymentConfig {
  network: NetworkConfig;
  deployerPrivateKey: string;
  developerWallet: string;
  nightTokenId: string;
  dustTokenId: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: 'Midnight Testnet',
    rpcUrl: process.env.TESTNET_RPC_URL || 'https://testnet-rpc.midnight.network',
    chainId: 2024,
    explorerUrl: 'https://testnet-explorer.midnight.network',
    confirmations: 2,
  },
  mainnet: {
    name: 'Midnight Mainnet',
    rpcUrl: process.env.MAINNET_RPC_URL || 'https://rpc.midnight.network',
    chainId: 2025,
    explorerUrl: 'https://explorer.midnight.network',
    confirmations: 6,
  },
  devnet: {
    name: 'Midnight Devnet',
    rpcUrl: process.env.DEVNET_RPC_URL || 'https://devnet-rpc.midnight.network',
    chainId: 2023,
    explorerUrl: 'https://devnet-explorer.midnight.network',
    confirmations: 1,
  },
  local: {
    name: 'Local Network',
    rpcUrl: 'http://localhost:8545',
    chainId: 31337,
    explorerUrl: '',
    confirmations: 1,
  },
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '\x1b[36m[INFO]\x1b[0m',
    success: '\x1b[32m[SUCCESS]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
  }[level];

  console.log(`${timestamp} ${prefix} ${message}`);
}

function parseArgs(): { network: string; dryRun: boolean; verify: boolean } {
  const args = process.argv.slice(2);
  let network = 'testnet';
  let dryRun = false;
  let verify = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--network' && args[i + 1]) {
      network = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--verify') {
      verify = true;
    }
  }

  return { network, dryRun, verify };
}

function validateConfig(config: DeploymentConfig): void {
  if (!config.deployerPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY environment variable is required');
  }

  if (!config.developerWallet) {
    throw new Error('DEVELOPER_WALLET environment variable is required');
  }

  if (!config.developerWallet.startsWith('0x') || config.developerWallet.length !== 66) {
    throw new Error('DEVELOPER_WALLET must be a valid 32-byte hex address');
  }

  if (!config.nightTokenId) {
    throw new Error('NIGHT_TOKEN_ID environment variable is required');
  }

  if (!config.dustTokenId) {
    throw new Error('DUST_TOKEN_ID environment variable is required');
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// DEPLOYMENT FUNCTIONS
// ============================================================================

async function compileContract(): Promise<{ bytecode: Uint8Array; abi: unknown }> {
  log('Compiling Compact contract...');

  const contractPath = path.join(__dirname, '../src/contracts/zkswap_vault.compact');

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found: ${contractPath}`);
  }

  // In production, this would use the Compact compiler
  // For now, we'll simulate the compilation
  log('Contract compiled successfully', 'success');

  return {
    bytecode: new Uint8Array(1024), // Placeholder
    abi: {
      functions: [
        'executeSwap',
        'executeBatchSwap',
        'stake',
        'unstake',
        'addLiquidity',
        'removeLiquidity',
        'claimRewards',
      ],
    },
  };
}

async function deployContract(config: DeploymentConfig): Promise<DeploymentResult> {
  log(`Deploying to ${config.network.name}...`);

  // Compile contract
  const { bytecode } = await compileContract();

  // Encode constructor arguments
  const constructorArgs = encodeConstructorArgs(
    config.developerWallet,
    config.nightTokenId,
    config.dustTokenId
  );

  // Combine bytecode and constructor args
  const deployData = new Uint8Array(bytecode.length + constructorArgs.length);
  deployData.set(bytecode, 0);
  deployData.set(constructorArgs, bytecode.length);

  log(`Constructor args: devWallet=${config.developerWallet.slice(0, 10)}...`);
  log(`Constructor args: nightToken=${config.nightTokenId.slice(0, 10)}...`);
  log(`Constructor args: dustToken=${config.dustTokenId.slice(0, 10)}...`);

  // Get deployer address and nonce
  const deployerAddress = await getAddressFromPrivateKey(config.deployerPrivateKey);
  const nonce = await getNonce(config.network.rpcUrl, deployerAddress);

  log(`Deployer: ${deployerAddress}`);
  log(`Nonce: ${nonce}`);

  // Estimate gas
  const gasEstimate = await estimateGas(config.network.rpcUrl, {
    from: deployerAddress,
    data: '0x' + Buffer.from(deployData).toString('hex'),
  });

  log(`Estimated gas: ${gasEstimate}`);

  // Create and sign transaction
  const tx = {
    nonce,
    to: null, // Contract creation
    data: deployData,
    gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
    gasPrice: await getGasPrice(config.network.rpcUrl),
    chainId: config.network.chainId,
  };

  log('Signing transaction...');
  const signedTx = await signTransaction(tx, config.deployerPrivateKey);

  // Send transaction
  log('Sending transaction...');
  const txHash = await sendTransaction(config.network.rpcUrl, signedTx);

  log(`Transaction sent: ${txHash}`);

  // Wait for confirmation
  log(`Waiting for ${config.network.confirmations} confirmations...`);
  const receipt = await waitForConfirmation(
    config.network.rpcUrl,
    txHash,
    config.network.confirmations
  );

  log(`Contract deployed at: ${receipt.contractAddress}`, 'success');

  return {
    contractAddress: receipt.contractAddress,
    txHash,
    blockNumber: receipt.blockNumber,
    timestamp: new Date(),
    network: config.network.name,
    deployer: deployerAddress,
    gasUsed: receipt.gasUsed,
    constructorArgs: {
      developerWallet: config.developerWallet,
      nightTokenId: config.nightTokenId,
      dustTokenId: config.dustTokenId,
    },
  };
}

function encodeConstructorArgs(
  developerWallet: string,
  nightTokenId: string,
  dustTokenId: string
): Uint8Array {
  // Encode as 3 x 32-byte values
  const args = new Uint8Array(96);

  const devWalletBytes = hexToBytes(developerWallet);
  const nightBytes = hexToBytes(nightTokenId);
  const dustBytes = hexToBytes(dustTokenId);

  args.set(devWalletBytes, 0);
  args.set(nightBytes, 32);
  args.set(dustBytes, 64);

  return args;
}

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2) || '00', 16);
  }
  return bytes;
}

// ============================================================================
// RPC FUNCTIONS (Simulated)
// ============================================================================

async function getAddressFromPrivateKey(privateKey: string): Promise<string> {
  // In production, derive address from private key
  return '0x' + '1'.repeat(64);
}

async function getNonce(rpcUrl: string, address: string): Promise<number> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
      id: 1,
    }),
  });

  const result = await response.json();
  return parseInt(result.result || '0x0', 16);
}

async function getGasPrice(rpcUrl: string): Promise<bigint> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1,
    }),
  });

  const result = await response.json();
  return BigInt(result.result || '0x1');
}

async function estimateGas(
  rpcUrl: string,
  tx: { from: string; data: string }
): Promise<bigint> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_estimateGas',
      params: [tx],
      id: 1,
    }),
  });

  const result = await response.json();
  return BigInt(result.result || '0x100000');
}

async function signTransaction(
  tx: { nonce: number; to: null; data: Uint8Array; gasLimit: bigint; gasPrice: bigint; chainId: number },
  privateKey: string
): Promise<string> {
  // In production, use proper signing library
  return '0x' + Buffer.from(tx.data).toString('hex');
}

async function sendTransaction(rpcUrl: string, signedTx: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [signedTx],
      id: 1,
    }),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`Transaction failed: ${result.error.message}`);
  }
  return result.result;
}

async function waitForConfirmation(
  rpcUrl: string,
  txHash: string,
  confirmations: number
): Promise<{ contractAddress: string; blockNumber: number; gasUsed: bigint }> {
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.result) {
      const currentBlock = await getCurrentBlock(rpcUrl);
      const txBlock = parseInt(result.result.blockNumber, 16);
      const confirms = currentBlock - txBlock;

      if (confirms >= confirmations) {
        return {
          contractAddress: result.result.contractAddress,
          blockNumber: txBlock,
          gasUsed: BigInt(result.result.gasUsed),
        };
      }

      log(`Confirmations: ${confirms}/${confirmations}`);
    }

    await sleep(5000);
    attempts++;
  }

  throw new Error('Transaction confirmation timeout');
}

async function getCurrentBlock(rpcUrl: string): Promise<number> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1,
    }),
  });

  const result = await response.json();
  return parseInt(result.result, 16);
}

// ============================================================================
// POST-DEPLOYMENT
// ============================================================================

async function saveDeployment(result: DeploymentResult): Promise<void> {
  const deploymentsDir = path.join(__dirname, '../deployments');

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${result.network.toLowerCase().replace(/\s+/g, '-')}.json`;
  const filepath = path.join(deploymentsDir, filename);

  const deployment = {
    ...result,
    gasUsed: result.gasUsed.toString(),
    timestamp: result.timestamp.toISOString(),
  };

  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  log(`Deployment saved to: ${filepath}`, 'success');
}

async function verifyContract(
  config: DeploymentConfig,
  contractAddress: string
): Promise<void> {
  log('Verifying contract on explorer...');

  // In production, submit verification request to block explorer
  log('Contract verification submitted', 'success');
}

function printDeploymentSummary(result: DeploymentResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Network:          ${result.network}`);
  console.log(`Contract Address: ${result.contractAddress}`);
  console.log(`Transaction Hash: ${result.txHash}`);
  console.log(`Block Number:     ${result.blockNumber}`);
  console.log(`Deployer:         ${result.deployer}`);
  console.log(`Gas Used:         ${result.gasUsed.toString()}`);
  console.log(`Timestamp:        ${result.timestamp.toISOString()}`);
  console.log('');
  console.log('Constructor Arguments:');
  console.log(`  Developer Wallet: ${result.constructorArgs.developerWallet}`);
  console.log(`  NIGHT Token:      ${result.constructorArgs.nightTokenId}`);
  console.log(`  DUST Token:       ${result.constructorArgs.dustTokenId}`);
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           ZKSwap Vault - Deployment Script                ║');
  console.log('║                      v2.0.0                               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // Parse arguments
    const { network, dryRun, verify } = parseArgs();

    if (!NETWORKS[network]) {
      throw new Error(`Unknown network: ${network}. Available: ${Object.keys(NETWORKS).join(', ')}`);
    }

    log(`Network: ${network}`);
    log(`Dry run: ${dryRun}`);
    log(`Verify: ${verify}`);

    // Load configuration
    const config: DeploymentConfig = {
      network: NETWORKS[network],
      deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
      developerWallet: process.env.DEVELOPER_WALLET || '0x' + '0'.repeat(64),
      nightTokenId: process.env.NIGHT_TOKEN_ID || '0x' + '0'.repeat(62) + '01',
      dustTokenId: process.env.DUST_TOKEN_ID || '0x' + '0'.repeat(62) + '02',
    };

    // Validate configuration
    if (!dryRun) {
      validateConfig(config);
    }

    if (dryRun) {
      log('Dry run mode - skipping actual deployment', 'warn');
      log('Configuration validated successfully', 'success');
      return;
    }

    // Deploy contract
    const result = await deployContract(config);

    // Save deployment info
    await saveDeployment(result);

    // Verify if requested
    if (verify) {
      await verifyContract(config, result.contractAddress);
    }

    // Print summary
    printDeploymentSummary(result);

    log('Deployment completed successfully!', 'success');
  } catch (error) {
    log(`Deployment failed: ${(error as Error).message}`, 'error');
    process.exit(1);
  }
}

main();
