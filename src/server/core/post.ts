import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // 2701 Cyberpunk Vault Splash Screen
      appDisplayName: '2701',
      backgroundUri: 'vault-background.svg',
      buttonLabel: 'Enter the Vault',
      description: 'A New Cipher Has Dropped - Decode the mystery within',
      heading: 'A New Cipher Has Dropped',
      appIconUri: 'cicada-icon.svg',
    },
    postData: {
      gameState: 'vault_entry',
      cipherActive: true,
    },
    subredditName: subredditName,
    title: '2701: New Cipher Available',
  });
};
