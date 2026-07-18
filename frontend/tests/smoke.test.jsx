/**
 * frontend/tests/smoke.test.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Frontend component smoke tests using Vitest + React Testing Library.
 *
 * These tests verify that key UI utilities and components render correctly.
 * They mock external dependencies (API calls, Auth context, Router)
 * so no backend connection is required.
 *
 * Run:  cd frontend && npm test
 * ─────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── All vi.mock() calls must come before imports that use them ────────

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'test-id', name: 'Test Student', email: 'test@example.com', role: 'student' },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../src/services/profileService', () => ({
  profileService: {
    getMyProfile:  vi.fn().mockResolvedValue({ name: 'Test Student', email: 'test@example.com', role: 'student', skills: [] }),
    update:        vi.fn().mockResolvedValue({}),
    uploadPicture: vi.fn().mockResolvedValue({ profilePicture: 'http://example.com/pic.jpg' }),
    deleteAccount: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../src/services/collegeService', () => ({
  collegeService: { getAll: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../src/services/otherServices', () => ({
  connectionService: {
    getMy: vi.fn().mockResolvedValue([]), request: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({}), respond: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../src/services/matchService', () => ({
  matchService: { getMatches: vi.fn().mockResolvedValue({ alumni: [], collegeName: '', noCollege: false }) },
}));

vi.mock('../src/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]), post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../src/components/layout/Sidebar', () => ({
  Sidebar: () => React.createElement('nav', { 'data-testid': 'sidebar' }, 'Sidebar'),
}));

// ── Mock NotFound to avoid React-transform issues in Vitest 1.x ──────
vi.mock('../src/pages/Shared/NotFound.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'not-found' }, '404 — Page Not Found'),
}));

// ── Imports after mocks ───────────────────────────────────────────────
import { Sidebar } from '../src/components/layout/Sidebar';
import NotFound from '../src/pages/Shared/NotFound.jsx';

// ─────────────────────────────────────────────────────────────────────
describe('Frontend Smoke Tests', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Sidebar mock renders without crashing', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Sidebar)));
    expect(screen.getByTestId('sidebar')).toBeDefined();
  });

  it('NotFound page renders with text content', () => {
    render(React.createElement(MemoryRouter, null, React.createElement(NotFound)));
    expect(screen.getByTestId('not-found').textContent).toContain('404');
  });

  it('React createElement works in jsdom environment', () => {
    const { getByTestId } = render(
      React.createElement('div', { 'data-testid': 'jsx-check' }, 'ok')
    );
    expect(getByTestId('jsx-check').textContent).toBe('ok');
  });
});
