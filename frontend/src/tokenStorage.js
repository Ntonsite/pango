const KEY = 'token';
const REMEMBER_KEY = 'token_remember';

export const tokenStorage = {
  get() {
    return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
  },
  set(token, remember) {
    if (remember) {
      localStorage.setItem(KEY, token);
      localStorage.setItem(REMEMBER_KEY, '1');
      sessionStorage.removeItem(KEY);
    } else {
      sessionStorage.setItem(KEY, token);
      localStorage.removeItem(KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
  },
  clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(KEY);
  },
};
