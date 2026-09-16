/** Semantic colors shared by business components. Hex values omit '#'. */
export const businessPalettes = {
  'navy-teal': { paper: 'F5F8FA', ink: '142B40', muted: '526475', accent: '006F73', highlight: 'BCE9E5', line: 'CCD8E0', dark: '142B40', light: 'F5F8FA' },
  'forest-sand': { paper: 'F5F1E8', ink: '123936', muted: '52635B', accent: '28664D', highlight: 'D8F0A3', line: 'C6CDC2', dark: '123936', light: 'F5F1E8' },
  'cobalt-white': { paper: 'FAF9F6', ink: '242629', muted: '5E6268', accent: '214CC4', highlight: 'DDE7FF', line: 'D5D8DD', dark: '183387', light: 'FAF9F6' },
  'burgundy-cream': { paper: 'FBF6EE', ink: '35252B', muted: '725660', accent: '8C2946', highlight: 'F0CDD5', line: 'DFCFD2', dark: '4B1F2D', light: 'FBF6EE' },
  'graphite-orange': { paper: 'FAF8F4', ink: '25282C', muted: '62605B', accent: 'A94413', highlight: 'FFDFC6', line: 'D8D4CB', dark: '25282C', light: 'FAF8F4' },
  'aubergine-lime': {"paper": "F8F4F7", "ink": "312137", "muted": "705A70", "accent": "69336F", "highlight": "DDEDAB", "line": "DED1DF", "dark": "312137", "light": "F8F4F7"},
  'petrol-apricot': {"paper": "F6F5EF", "ink": "163D44", "muted": "4C666A", "accent": "176272", "highlight": "FFD3B0", "line": "C9D8D8", "dark": "163D44", "light": "F6F5EF"},
  'ink-lilac': {"paper": "F6F5FA", "ink": "252A4B", "muted": "5F627B", "accent": "494F8C", "highlight": "DCD2F4", "line": "D7D6E5", "dark": "252A4B", "light": "F6F5FA"},
  'plum-celadon': {"paper": "F8F5F1", "ink": "432B3A", "muted": "705B69", "accent": "783E60", "highlight": "CEE4D8", "line": "DDCFD6", "dark": "432B3A", "light": "F8F5F1"},
  'indigo-saffron': {"paper": "F8F7F0", "ink": "252E4D", "muted": "5E6577", "accent": "354D92", "highlight": "F5DA91", "line": "D4D8E0", "dark": "252E4D", "light": "F8F7F0"},
  'oxblood-rose': {"paper": "FAF4F3", "ink": "48262D", "muted": "76565E", "accent": "8A3246", "highlight": "F2CFCC", "line": "E1CDD0", "dark": "48262D", "light": "FAF4F3"},
  'moss-linen': {"paper": "F5F3E9", "ink": "303A2C", "muted": "606856", "accent": "4B653A", "highlight": "E2E4B9", "line": "D4D7C6", "dark": "303A2C", "light": "F5F3E9"},
  'espresso-ice': {"paper": "F8F5F0", "ink": "3D2D28", "muted": "746058", "accent": "78503C", "highlight": "CBE5EB", "line": "DFD3CB", "dark": "3D2D28", "light": "F8F5F0"},
  'terracotta-glacier': {"paper": "FAF5EF", "ink": "493129", "muted": "786054", "accent": "984B32", "highlight": "CEE5E7", "line": "E2D4C9", "dark": "493129", "light": "FAF5EF"},
  'midnight-citron': {"paper": "F6F7F1", "ink": "232E39", "muted": "5A6570", "accent": "385E72", "highlight": "E4EFAD", "line": "D3DDDB", "dark": "232E39", "light": "F6F7F1"},
  'mineral-copper': {"paper": "F4F7F5", "ink": "263F3C", "muted": "556C66", "accent": "397166", "highlight": "F0CEB5", "line": "CCDBD5", "dark": "263F3C", "light": "F4F7F5"},
  'slate-wisteria': {"paper": "F7F5F9", "ink": "343444", "muted": "696276", "accent": "655080", "highlight": "E1D4ED", "line": "DAD3E2", "dark": "343444", "light": "F7F5F9"},
  'olive-orchid': {"paper": "F8F6EF", "ink": "3C3C28", "muted": "6A6752", "accent": "68612F", "highlight": "E8D6EA", "line": "DBD8C5", "dark": "3C3C28", "light": "F8F6EF"},
  'prussian-butter': {"paper": "F8F6EE", "ink": "193B50", "muted": "556773", "accent": "245B79", "highlight": "F4E5B8", "line": "D1DADE", "dark": "193B50", "light": "F8F6EE"},
  'mulberry-mist': {"paper": "F8F4F6", "ink": "452E43", "muted": "745F70", "accent": "803E73", "highlight": "D2E4E5", "line": "DECFDA", "dark": "452E43", "light": "F8F4F6"},
};
const roles = ['paper','ink','muted','accent','highlight','line','dark','light'];
function luminance(hex) {
 const v = hex.match(/../g).map(x => parseInt(x,16)/255).map(x => x <= .04045 ? x/12.92 : ((x+.055)/1.055)**2.4);
 return v[0]*.2126 + v[1]*.7152 + v[2]*.0722;
}
export function contrastRatio(a,b) {
 const l = [luminance(a),luminance(b)].sort((x,y)=>y-x); return (l[0]+.05)/(l[1]+.05);
}
/** Reject unreadable palettes before adding slides, preserving brand hue for decoration when needed. */
export function resolveBusinessPalette(base, override = {}) {
 const chosen = typeof override === 'string' ? businessPalettes[override] : override;
 if (!chosen || typeof chosen !== 'object' || Array.isArray(chosen)) throw new Error('Unknown business palette');
 const unknown = Object.keys(chosen).filter(k=>!roles.includes(k));
 if (unknown.length) throw new Error(`Unknown palette roles: ${unknown.join(', ')}`);
 const merged = { ...base, ...chosen };
 for (const role of roles) {
   if (typeof merged[role] !== 'string' || !/^#?[0-9a-f]{6}$/i.test(merged[role])) throw new Error(`Invalid palette color: ${role}`);
   merged[role] = merged[role].replace(/^#/,'').toUpperCase();
 }
 const pairs = [['ink','paper'],['muted','paper'],['accent','paper'],['light','dark'],['highlight','dark'],['light','ink'],['light','accent']];
 for (const [a,b] of pairs) if (contrastRatio(merged[a],merged[b]) < 4.5) throw new Error(`Palette contrast below 4.5:1: ${a}/${b}`);
 return merged;
}
