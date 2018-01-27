export function getAssets({ assets }) {
  return assets || {};
}

export function getDefaultAssets({ defaultAssets }) {
  return defaultAssets;
}

export function getAssetById({ assets }) {
  return (id) => ((assets && assets[id]) ? assets[id] : false);
}

export function getAssetFieldById({ assets }) {
  return (field, id) => ((assets && assets[id]) ? assets[id][field] : false);
}

export function getBaseMarketId(state) {
  return state.baseMarketId;
}

export function getPreferredAssetId(state) {
  return state.preferredAssetId;
}

export function getAssetsPrices({ prices }) {
  return prices;
}
