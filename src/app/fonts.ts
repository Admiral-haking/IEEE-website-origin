// Local font wiring without external fetch.
// We expose simple `variable` class names that set CSS variables
// defined in `globals.css`. This avoids `next/font` network fetches
// during production builds (useful in restricted environments).

export const latin = {
  variable: 'font-latin',
};

export const fa = {
  variable: 'font-fa',
};
