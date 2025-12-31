import { HttpAgent, Actor } from '@dfinity/agent';
import { idlFactory, canisterId } from 'declarations/dbank_backend';

/**
 * Backend Service - Centralized Internet Computer Actor Management
 * 
 * Dynamically configures the HttpAgent based on the deployment network:
 * - Local: Connects to localhost:4943 and fetches root key.
 * - Mainnet (ic): Connects to icp-api.io and skips root key fetch (security requirement).
 */

const isMainnet = process.env.DFX_NETWORK === "ic";
const host = isMainnet ? "https://icp-api.io" : `http://localhost:4943`;

const agent = await HttpAgent.create({ host });

if (!isMainnet) {
    await agent.fetchRootKey().catch(err => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
    });
}

export const dbank_backend = Actor.createActor(idlFactory, {
    agent,
    canisterId,
});
