import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom', // Or 'happy-dom', depending on your needs
      include: ['tests/vitest/**/*.test.js'], // Target only the vitest folder
      exclude: [...configDefaults.exclude], // Exclude default files
      root: fileURLToPath(new URL('./', import.meta.url)),
      
      globals: true, // Ensure that globals like `vi` and `expect` are available
    },
  })
);
