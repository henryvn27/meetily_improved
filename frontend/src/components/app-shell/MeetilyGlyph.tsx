import type { SVGProps } from 'react';

export type MeetilyGlyphName =
  | 'beta'
  | 'capture'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'home'
  | 'import'
  | 'library'
  | 'recall'
  | 'search'
  | 'settings'
  | 'stop'
  | 'theme-dark'
  | 'theme-light'
  | 'theme-system';

interface MeetilyGlyphProps extends SVGProps<SVGSVGElement> {
  name: MeetilyGlyphName;
}

/**
 * The workspace glyphs are intentionally small, geometric, and structural.
 * They are Meetily-owned marks for persistent controls, not illustrations or
 * a substitute for a full semantic icon library in content-heavy screens.
 */
export function MeetilyGlyph({ name, ...props }: MeetilyGlyphProps) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.45,
  };

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" {...props}>
      {name === 'home' && <><path {...shared} d="M3.5 9.1 10 3.8l6.5 5.3v6.2a1.2 1.2 0 0 1-1.2 1.2H4.7a1.2 1.2 0 0 1-1.2-1.2V9.1Z" /><path {...shared} d="M7.6 16.5v-4.3h4.8v4.3" /></>}
      {name === 'capture' && <><rect {...shared} x="5.2" y="3.2" width="9.6" height="13.6" rx="3.7" /><path {...shared} d="M3.4 10a6.6 6.6 0 0 0 13.2 0M10 16.6v2.1M7.4 18.7h5.2" /></>}
      {name === 'beta' && <><path {...shared} d="M7.3 3.6h5.4M8.2 3.6v4.6l-3.5 5.7a2 2 0 0 0 1.7 3h7.2a2 2 0 0 0 1.7-3l-3.5-5.7V3.6" /><path {...shared} d="M6.5 13.1h7" /></>}
      {name === 'library' && <><path {...shared} d="M4.1 3.7h8.7a2.7 2.7 0 0 1 2.7 2.7v9.9H6.8a2.7 2.7 0 0 0-2.7 0V3.7Z" /><path {...shared} d="M6.8 16.3a2.7 2.7 0 0 1 2.7-2.7h6M7.2 7.3h5.1M7.2 10.2h4" /></>}
      {name === 'recall' && <><path {...shared} d="M4.2 15.8V8.7a3.1 3.1 0 0 1 3.1-3.1h5.4a3.1 3.1 0 0 1 3.1 3.1v3.5a3.1 3.1 0 0 1-3.1 3.1H8.4l-4.2 2.2v-1.7Z" /><path {...shared} d="M7.2 10.4h5.6M10 7.8v5.2" /></>}
      {name === 'search' && <><circle {...shared} cx="8.5" cy="8.5" r="4.5" /><path {...shared} d="m12 12 4.1 4.1" /></>}
      {name === 'close' && <path {...shared} d="m5.6 5.6 8.8 8.8m0-8.8-8.8 8.8" />}
      {name === 'chevron-left' && <path {...shared} d="m11.8 4.8-5.1 5.2 5.1 5.2" />}
      {name === 'chevron-right' && <path {...shared} d="m8.2 4.8 5.1 5.2-5.1 5.2" />}
      {name === 'stop' && <rect {...shared} x="5.5" y="5.5" width="9" height="9" rx="1.2" />}
      {name === 'import' && <><path {...shared} d="M10 3.5v8.2M6.9 8.6 10 11.7l3.1-3.1" /><path {...shared} d="M4.2 12.4v2.1a2 2 0 0 0 2 2h7.6a2 2 0 0 0 2-2v-2.1" /></>}
      {name === 'settings' && <><circle {...shared} cx="10" cy="10" r="2.3" /><path {...shared} d="M10 3.2v1.4m0 10.8v1.4m6.8-6.8h-1.4M4.6 10H3.2m11.6-4.8-1 1m-7.6 7.6-1 1m9.6 0-1-1m-7.6-7.6-1-1" /></>}
      {name === 'theme-system' && <><rect {...shared} x="3.4" y="4.1" width="13.2" height="9.3" rx="1.4" /><path {...shared} d="M7.2 16.5h5.6M10 13.4v3.1" /></>}
      {name === 'theme-light' && <><circle {...shared} cx="10" cy="10" r="3.2" /><path {...shared} d="M10 2.8v1.6m0 11.2v1.6m7.2-7.2h-1.6M4.4 10H2.8m12.3-5.1L14 6m-8 8-1.1 1.1m10.2 0L14 14m-8-8L4.9 4.9" /></>}
      {name === 'theme-dark' && <path {...shared} d="M14.6 12.8A6.2 6.2 0 0 1 7.2 5.4 6.2 6.2 0 1 0 14.6 12.8Z" />}
    </svg>
  );
}
