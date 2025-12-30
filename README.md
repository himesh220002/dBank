# dBank - Decentralized Banking & Investment Platform

Welcome to **dBank**, a cutting-edge decentralized application (dApp) built on the **Internet Computer (IC)**. This platform provides users with a secure and transparent environment to manage finances, invest in diverse asset classes, and track portfolio performance in real-time.

---

## 🚀 Key Features

- **Decentralized Wallet**: Securely manage your **dBank (⨎)** and **Delta (Δ)** tokens on the blockchain.
- **Asset Marketplace**: Invest in diverse categories including:
  - **Crypto**: Bitcoin, Ethereum, Solana, and more.
  - **Forex**: USD, EUR, GBP, and other major currencies.
  - **Mutual Funds**: Real-time Indian mutual fund tracking.
  - **Minerals & Commodities**: Gold, Silver, Crude Oil, and industrial metals.
- **Interactive Portfolio**: Track your Profit/Loss (P/L) with dynamic charts powered by Recharts.
- **Goal Management**: Create financial goals (Savings/EMI) with automatic interest compounding.
- **PIN-Protected Security**: Every transaction—buying or selling—is secured with a dedicated verification PIN.
- **Realistic Data System**: Advanced statistical modeling and trend analysis for historical price tracking.

## 🛠️ Tech Stack

- **Backend**: Motoko (Internet Computer native language)
- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **Visualization**: Recharts, Lucide Icons
- **Animation**: Framer Motion

---

## 📦 Getting Started

### Prerequisites
- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install) installed.
- Node.js and npm.

### Local Development

1. **Clone and Setup**:
   ```bash
   git clone https://github.com/your-username/dbank.git
   cd dbank
   ```

2. **Start the local IC replica**:
   ```bash
   dfx start --background
   ```

3. **Deploy the canisters**:
   ```bash
   dfx deploy
   ```

4. **Start the frontend**:
   ```bash
   cd src/dbank_frontend
   npm install
   npm run start
   ```

## 🧪 Testing

The project includes an automated test suite for the Investment Fallback Data System:
```bash
./run-tests.sh
```

---

## 🔗 IC Development Resources

This project was initialized using the standard `dfx` template. For more in-depth learning:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- [Motoko Language Quick Reference](https://internetcomputer.org/docs/current/motoko/main/language-manual)

### Helpful Commands

```bash
dfx help
dfx canister --help
```

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, ensure you handle the `DFX_NETWORK` variable correctly to avoid fetching the root key in production. See `dfx.json` for environment overrides.
