#!/usr/bin/env node
import { createProgram } from '../src/cli/index.js';

await createProgram().parseAsync(process.argv);
