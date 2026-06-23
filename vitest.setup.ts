import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
// This gives you assertions like .toBeInTheDocument(), .toHaveValue(), etc.
expect.extend(matchers)

// Note: afterEach cleanup should be added in individual test files that use React Testing Library
// Example: import { afterEach } from 'vitest'; import { cleanup } from '@testing-library/react';
//          afterEach(() => { cleanup(); })
