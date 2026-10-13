import '@testing-library/jest-dom';

// JSDOM does not implement window.scrollTo
window.scrollTo = jest.fn();
