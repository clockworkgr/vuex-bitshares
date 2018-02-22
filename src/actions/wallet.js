import { PrivateKey, key, Aes } from 'bitsharesjs';
import * as types from '../mutations';
import { getAccountIdByOwnerPubkey, getAccount } from '../services/wallet.js';

const OWNER_KEY_INDEX = 1;

export const createWallet = ({ commit }, { brainkey, password }) => {
  const passwordAes = Aes.fromSeed(password);
  const encryptionBuffer = key.get_random_key().toBuffer();
  const encryptionKey = passwordAes.encryptToHex(encryptionBuffer);
  const aesPrivate = Aes.fromSeed(encryptionBuffer);

  const normalizedBrainkey = key.normalize_brainKey(brainkey);
  const encryptedBrainkey = aesPrivate.encryptToHex(normalizedBrainkey);
  const passwordPrivate = PrivateKey.fromSeed(password);
  const passwordPubkey = passwordPrivate.toPublicKey().toPublicKeyString();

  // const ownerKey = key.get_brainPrivateKey(brainkey, OWNER_KEY_INDEX);
  // const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();

  const result = {
    passwordPubkey,
    encryptionKey,
    encryptedBrainkey,
    aesPrivate,
    // userId: await getAccountIdByOwnerPubkey(ownerPubkey)
  };

  commit(types.WALLET_CREATED, result);
};

export const unlockWallet = ({ commit, state }, password) => {
  const passwordAes = Aes.fromSeed(password);
  const encryptionPlainbuffer = passwordAes.decryptHexToBuffer(state.encryptionKey);
  const aesPrivate = Aes.fromSeed(encryptionPlainbuffer);
  commit(types.WALLET_UNLOCK, aesPrivate);
};

export const lockWallet = ({ commit }) => {
  commit(types.WALLET_LOCK);
};

export const createAccount = async ({ commit, getters }, {
  name,
  referrer,
  brainkey,
  faucetUrl = 'https://faucet.bitshares.eu/onboarding'
}) => {
  const { active, owner } = getters.getKeys;
  try {
    const response = await fetch(faucetUrl + '/api/v1/accounts', {
      method: 'post',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        account: {
          name,
          owner_key: owner.toPublicKey().toPublicKeyString(),
          active_key: active.toPublicKey().toPublicKeyString(),
          memo_key: active.toPublicKey().toPublicKeyString(),
          refcode: null,
          referrer
        }
      })
    });
    const result = await response.json();
    console.log(result);
    if (!result || (result && result.error)) {
      commit(types.WALLET_ACCOUNT_CREATE_ERROR, result.error.base[0]);
      return false;
    }

    // retrieve user id
    const ownerKey = key.get_brainPrivateKey(brainkey, OWNER_KEY_INDEX);
    const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
    const userId = await getAccountIdByOwnerPubkey(ownerPubkey);
    console.log(userId);

    commit(types.WALLET_ACCOUNT_CREATED, result);

    return true;
  } catch (error) {
    commit(types.WALLET_ACCOUNT_CREATE_ERROR, 'Account creation failed');
    return false;
  }
};
