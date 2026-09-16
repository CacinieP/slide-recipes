#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { generateSlideImage, IMAGE_PROVIDERS, resolveImageProvider, getImageBaseUrl } from '../lib/ai-image.js';
const args = process.argv.slice(2);
try {
  if (args[0] === '--check') {
    const provider = resolveImageProvider(args[1]);
    const c = IMAGE_PROVIDERS[provider];
    console.log(JSON.stringify({ provider, model: process.env[c.modelEnv] || c.defaultModel,
      endpointConfigured: Boolean(getImageBaseUrl(provider) || process.env.PPT_IMAGE_ENDPOINT),
      keyConfigured: Boolean(process.env[c.apiKeyEnv] || c.apiKeyFallbackEnvs?.some(k => process.env[k])),
      networkCalled: false }, null, 2));
  } else if (args[0] === '--help' || !args.length) {
    console.log('Usage: node generate-image.mjs request.json\n       node generate-image.mjs --check [provider]\nConfig lives in project .env; request JSON contains prompt, usage, provider and optional endpoint/model/extraBody.');
  } else {
    const request = JSON.parse(await readFile(args[0], 'utf8'));
    const result = await generateSlideImage(request);
    console.log(JSON.stringify(result, null, 2));
    if (!result) process.exitCode = 2;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
