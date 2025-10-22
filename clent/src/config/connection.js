import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { defineChain, celo } from '@reown/appkit/networks'

// ✅ 1. Define Celo Sepolia network
export const celoSepolia = defineChain({
  id: 11142220,
  caipNetworkId: 'eip155:11142220', 
  chainNamespace: 'eip155',
  name: 'Celo Sepolia',
  nativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/celo_sepolia'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://celo-sepolia.blockscout.com', 
    },
  },
  testnet: true,
})

// ✅ 2. Get Project ID (WalletConnect / AppKit)
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID

// ✅ 3. Choose which networks to support
const networks = [celoSepolia, celo] // Include mainnet + testnet

// ✅ 4. Optional metadata
const metadata = {
  name: 'My DApp',
  description: 'A decentralized healthcare app on Celo',
  url: 'https://real-estate-market-place-xi.vercel.app',
  icons: ['https://mydapp.example.com/icon.png'],
}

// ✅ 5. Initialize AppKit
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  themeVariables: {
    '--w3m-accent': '#35D07F',
    '--w3m-border-radius-master': '12px',
  },
  themeMode: 'dark',
  features: {
    analytics: true,
  },
})
