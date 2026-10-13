import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useI18n, detectUserLocale } from '../i18n/I18nContext';
import LanguageSelector from '../i18n/LanguageSelector';

function TestConsumer() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="translated-title">{t('common.appName')}</span>
      <span data-testid="param-translation">{t('persons.registeredCount', { count: 5 })}</span>
      <button onClick={() => setLocale('fr')}>Set French</button>
      <button onClick={() => setLocale('en')}>Set English</button>
      <LanguageSelector />
    </div>
  );
}

describe('I18n Multi-Language System', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  test('defaults to English when no storage and unsupported browser locale (e.g. German, Italian)', () => {
    Object.defineProperty(window, 'navigator', {
      value: { languages: ['de-DE', 'it-IT'], language: 'de-DE' },
      configurable: true,
      writable: true,
    });
    expect(detectUserLocale()).toBe('en');
  });

  test('auto-detects Spanish when browser locale starts with es', () => {
    Object.defineProperty(window, 'navigator', {
      value: { languages: ['es-AR', 'en-US'], language: 'es-AR' },
      configurable: true,
      writable: true,
    });
    expect(detectUserLocale()).toBe('es');
  });

  test('auto-detects French when browser locale starts with fr', () => {
    Object.defineProperty(window, 'navigator', {
      value: { languages: ['fr-FR', 'en-US'], language: 'fr-FR' },
      configurable: true,
      writable: true,
    });
    expect(detectUserLocale()).toBe('fr');
  });

  test('prefers localStorage over browser locale', () => {
    localStorage.setItem('app_locale', 'es');
    Object.defineProperty(window, 'navigator', {
      value: { languages: ['fr-FR'], language: 'fr-FR' },
      configurable: true,
      writable: true,
    });
    expect(detectUserLocale()).toBe('es');
  });

  test('provides translation with parameter substitution and locale switching across en, fr, and es', () => {
    render(
      <I18nProvider initialLocale="en">
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    expect(screen.getByTestId('param-translation')).toHaveTextContent('5 registered');

    // Switch to French via button
    fireEvent.click(screen.getByText('Set French'));
    expect(screen.getByTestId('current-locale')).toHaveTextContent('fr');
    expect(screen.getByTestId('param-translation')).toHaveTextContent('5 enregistrés');
    expect(localStorage.getItem('app_locale')).toBe('fr');

    // Switch to Spanish via LanguageSelector dropdown
    const select = screen.getByRole('combobox', { name: /Select language/i });
    fireEvent.change(select, { target: { value: 'es' } });
    expect(screen.getByTestId('current-locale')).toHaveTextContent('es');
    expect(screen.getByTestId('param-translation')).toHaveTextContent('5 registrados');
    expect(localStorage.getItem('app_locale')).toBe('es');

    // Switch back to English via LanguageSelector dropdown
    fireEvent.change(select, { target: { value: 'en' } });
    expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
    expect(screen.getByTestId('param-translation')).toHaveTextContent('5 registered');
    expect(localStorage.getItem('app_locale')).toBe('en');
  });
});
