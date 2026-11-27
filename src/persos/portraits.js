// Portraits « à la lampe » : bustes en clair-obscur, éclairés par le haut.
// Chaque fonction renvoie une chaîne SVG (viewBox 240 × 300). Les groupes nommés
// (data-part) servent aux animations : tête, sourcils, yeux, paupières, bouche.
// La tête est dessinée dans un repère local : x = 0 au milieu du visage, y = 0 sur la ligne des yeux.

let compteur = 0;
const uid = p => `${p}-${++compteur}`;

// Œil en amande, éclairé faiblement : blanc dans l'ombre, iris sombre, reflet de la lampe.
export function oeil({ x, y, l = 15, h = 5.5, regard = [0, 0], paupiere = 0.35, blanc = '#9B8A7C', iris = '#2B1B13', ombre = '#3A2219', id }) {
  const g = x - l / 2, d = x + l / 2;
  const amande = `M${g} ${y}Q${x} ${y - h} ${d} ${y}Q${x} ${y + h * 0.85} ${g} ${y}Z`;
  const r = h * 0.6;
  const ix = x + regard[0], iy = y + regard[1];
  const bord = y - h + h * 2 * paupiere;
  return `<g data-part="oeil">
<clipPath id="${id}"><path d="${amande}"/></clipPath>
<path d="${amande}" fill="${blanc}"/>
<g clip-path="url(#${id})">
<g data-part="regard">
<circle cx="${ix}" cy="${iy}" r="${r}" fill="${iris}"/>
<circle cx="${ix}" cy="${iy}" r="${r * 0.5}" fill="#0C0806"/>
<circle cx="${ix - r * 0.32}" cy="${iy - r * 0.38}" r="${Math.max(0.8, r * 0.26)}" fill="#FFF1DC"/>
</g>
<rect data-part="paupiere" data-ouvert="${bord - (y - h) + 2}" data-ferme="${2 * h + 4}" x="${g - 2}" y="${y - h - 2}" width="${l + 4}" height="${bord - (y - h) + 2}" fill="${ombre}"/>
</g>
<path d="M${g - 0.6} ${y + 0.4}Q${x} ${bord - 0.8} ${d + 0.6} ${y - 0.2}" fill="none" stroke="#120A07" stroke-width="1.9" stroke-linecap="round"/>
</g>`;
}

// Chute de lumière : le bas du buste se perd dans la pénombre.
export function chute(id, debut = 0.6, force = 0.88) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="${debut}" stop-color="#0E0806" stop-opacity="0"/>
<stop offset="1" stop-color="#0E0806" stop-opacity="${force}"/>
</linearGradient>`;
}

// Peau éclairée par le haut : plus claire au front, plus sourde vers le menton.
function peau(id, haut, bas) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${haut}"/><stop offset="1" stop-color="${bas}"/></linearGradient>`;
}

export function baron() {
  const oG = uid('bo'), oD = uid('bo'), ch = uid('bc'), pe = uid('bp');
  const s0 = '#341E16', s1 = '#6A402F', s3 = '#D39A71', s4 = '#F0C49C';
  return `<svg viewBox="0 0 240 300" class="portrait" aria-hidden="true">
<defs>${chute(ch, 0.66, 0.9)}${peau(pe, '#DBA57B', '#B57C59')}</defs>
<g data-part="corps">
<path d="M6 300C10 262 28 241 62 231C80 226 92 220 100 215L140 215C148 220 160 226 178 231C212 241 230 262 234 300Z" fill="#2A0B12"/>
<path d="M8 292C12 263 30 243 62 233C80 228 92 222 100 217L104 223C94 231 82 239 66 245C42 253 26 269 20 296Z" fill="#4E1622"/>
<path d="M232 292C228 263 210 243 178 233C160 228 148 222 140 217L136 223C146 231 158 239 174 245C198 253 214 269 220 296Z" fill="#3B1019"/>
<path d="M22 268C32 252 46 244 64 238M218 268C208 252 194 244 176 238" stroke="#7A2B38" stroke-width="1.6" fill="none" opacity=".7"/>
<path d="M100 216C92 238 86 268 82 300L110 300L120 286C114 262 108 240 106 220Z" fill="#110909"/>
<path d="M140 216C148 238 154 268 158 300L130 300L120 286C126 262 132 240 134 220Z" fill="#110909"/>
<path d="M98 226C92 248 88 270 86 298L90 298C92 272 96 250 101 228Z" fill="#3D2C2D"/>
<path d="M142 226C148 248 152 270 154 298L150 298C148 272 144 250 139 228Z" fill="#2A2021"/>
<path d="M96 204C104 213 136 213 144 204L148 222C136 229 104 229 92 222Z" fill="#8A7E70"/>
<path d="M96 204C104 211 136 211 144 204L145 210C136 217 104 217 95 210Z" fill="#DCCFBE"/>
<path d="M103 214C110 208 130 208 137 214C141 228 133 238 127 242C133 252 131 272 120 288C109 272 107 252 113 242C107 238 99 228 103 214Z" fill="#932216"/>
<path d="M107 216C113 211 127 211 133 216C131 224 127 230 122 234C117 228 111 222 107 216Z" fill="#C23E29"/>
<path d="M113 243C117 248 123 248 127 243C128 258 125 272 120 284C117 270 114 257 113 243Z" fill="#561009"/>
<path d="M117 248C118 260 119 270 120 278" stroke="#CF5640" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<circle cx="120" cy="245" r="3.1" fill="#C99A3E"/><circle cx="119" cy="244" r="1.1" fill="#FCE7B0"/>
</g>
<g data-part="tete" transform="translate(120 110)">
<path d="M-21 50C-22 62 -24 80 -28 100L28 100C24 80 22 62 21 50Z" fill="${s0}"/>
<path d="M-39 -6C-46 -10 -50 -2 -49 10C-48 22 -45 32 -39 34Z" fill="${s1}"/>
<path d="M39 -6C46 -10 50 -2 49 10C48 22 45 32 39 34Z" fill="${s0}"/>
<path d="M-44 4C-46 12 -44 20 -41 24" stroke="${s0}" stroke-width="1.6" fill="none"/>
<path d="M0 -48C22 -48 36 -40 38 -24C41 -8 41 6 40 16C39 32 36 44 31 54C25 66 15 78 0 80C-15 78 -25 66 -31 54C-36 44 -39 32 -40 16C-41 6 -41 -8 -38 -24C-36 -40 -22 -48 0 -48Z" fill="url(#${pe})"/>
<path d="M34 -40C40 -24 41 0 40 16C39 32 36 44 31 54C25 66 15 78 0 80C8 74 14 66 18 58C22 50 22 40 21 32C20 24 26 16 30 10C33 0 32 -16 28 -30Z" fill="${s1}"/>
<path d="M-34 -40C-40 -24 -41 0 -40 16C-39 32 -36 44 -31 54C-25 66 -15 78 0 80C-9 74 -15 66 -19 58C-23 50 -24 40 -23 32C-22 24 -28 16 -31 10C-34 0 -33 -16 -29 -30Z" fill="${s1}" opacity=".85"/>
<path d="M-12 74C-6 79 6 79 12 74C8 81 4 83 0 83C-4 83 -8 81 -12 74Z" fill="${s0}"/>
<path d="M-34 -41C-20 -47 20 -47 34 -41C22 -43 -22 -43 -34 -41Z" fill="${s1}" opacity=".6"/>
<path d="M-14 -40C-6 -43 6 -43 14 -40L12 -30C4 -32 -4 -32 -12 -30Z" fill="${s4}" opacity=".55"/>
<path d="M5 -9C12 -12 24 -13 31 -8C30 -2 27 3 22 6C16 7 10 6 6 3C4 0 4 -4 5 -9Z" fill="${s1}"/>
<path d="M-5 -9C-12 -12 -24 -13 -31 -8C-30 -2 -27 3 -22 6C-16 7 -10 6 -6 3C-4 0 -4 -4 -5 -9Z" fill="${s1}"/>
<path d="M6 -9C14 -12 26 -12 32 -7C28 -4 18 -4 8 -4Z" fill="${s0}"/>
<path d="M-6 -9C-14 -12 -26 -12 -32 -7C-28 -4 -18 -4 -8 -4Z" fill="${s0}"/>
<path d="M20 15C26 13 31 13 34 15C30 16.5 25 17 21 17Z" fill="${s4}" opacity=".5"/>
<path d="M-20 15C-26 13 -31 13 -34 15C-30 16.5 -25 17 -21 17Z" fill="${s4}" opacity=".5"/>
<ellipse cx="-22" cy="22" rx="9" ry="6" fill="#C2664A" opacity=".16"/><ellipse cx="22" cy="22" rx="9" ry="6" fill="#C2664A" opacity=".14"/><ellipse cx="0" cy="30" rx="6" ry="5" fill="#C2664A" opacity=".18"/>
<path d="M-18 -30C-6 -32 6 -32 18 -30M-14 -23C-4 -24.5 4 -24.5 14 -23" stroke="${s1}" stroke-width="1" fill="none" opacity=".45"/>
<path d="M-25 7C-19 10 -13 10 -9 7M25 7C19 10 13 10 9 7" stroke="${s1}" stroke-width="1" fill="none" opacity=".7"/>
<path d="M-27 0l-4 -2M-27 3l-4 1M27 0l4 -2M27 3l4 1" stroke="${s1}" stroke-width="1" fill="none" opacity=".7"/>
<path d="M4 -2C6 10 8 24 10 33C8 36 6 38 4 38C4 26 3 12 3 0Z" fill="${s1}"/>
<path d="M-4 -2C-6 10 -8 24 -10 33C-8 36 -6 38 -4 38C-4 26 -3 12 -3 0Z" fill="${s1}" opacity=".7"/>
<path d="M-1 -4L1 -4L1.6 22L-1.6 22Z" fill="${s4}" opacity=".7"/>
<ellipse cx="0" cy="31" rx="3" ry="2.4" fill="${s4}"/>
<path d="M-11 34C-14 30 -11 26 -6 28" stroke="${s1}" stroke-width="1.4" fill="none"/>
<path d="M11 34C14 30 11 26 6 28" stroke="${s1}" stroke-width="1.4" fill="none"/>
<path d="M-10 36C-6 41 6 41 10 36C8 42 4 45 0 45C-4 45 -8 42 -10 36Z" fill="${s0}"/>
<path d="M-9 42C-4 46 4 46 9 42C10 46 9 50 8 51L-8 51C-9 50 -10 46 -9 42Z" fill="${s1}"/>
<path d="M10 35C16 41 18 49 16 59C15 51 13 43 9 39Z" fill="${s1}"/>
<path d="M-10 35C-16 41 -18 49 -16 59C-15 51 -13 43 -9 39Z" fill="${s1}"/>
<g data-part="bouche">
<path d="M-14 52C-8 49 -3 50 0 51C3 50 8 49 14 52C9 54 4 55 0 55C-4 55 -9 54 -14 52Z" fill="${s1}"/>
<path d="M-15 52.5C-8 56 8 56 16 50.5" stroke="#170D09" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M-6 56.5C-2 57.5 3 57.5 7 56L6 58.5C2 59.5 -2 59.5 -5 58.5Z" fill="${s4}" opacity=".9"/>
</g>
<path d="M-10 60C-4 63 4 63 10 60C8 65 4 67 0 67C-4 67 -8 65 -10 60Z" fill="${s1}"/>
<path d="M-16 49C-10 45.5 -4 45.5 0 47C4 45.5 10 45.5 16 49C19 48 21 46 22 43C21 49 18 51 14 51C8 50 4 50 0 51C-4 50 -8 50 -14 51C-18 51 -21 49 -22 43C-21 46 -19 48 -16 49Z" fill="#110B08"/>
<g data-part="yeux">
${oeil({ x: -17, y: 1, regard: [1, 0.4], paupiere: 0.46, id: oG })}
${oeil({ x: 17, y: 1, regard: [1, 0.4], paupiere: 0.4, id: oD })}
</g>
<g data-part="sourcils">
<path d="M-6 -12C-14 -18 -28 -19 -36 -13L-35 -10C-28 -15 -15 -15 -7 -9Z" fill="#16100C"/>
<path d="M6 -15C14 -24 28 -24 36 -16L35 -13C28 -19 15 -20 7 -12Z" fill="#16100C"/>
</g>
<path d="M-42 -14C-46 -50 -24 -78 0 -79C24 -78 46 -50 42 -14C40 -26 37 -34 33 -40C24 -46 14 -46 7 -44L0 -38L-7 -44C-14 -46 -24 -46 -33 -40C-37 -34 -40 -26 -42 -14Z" fill="#14100D"/>
<path d="M-42 -14C-44 -26 -42 -34 -37 -40L-33 -38C-37 -32 -39 -24 -40 -14Z" fill="#8C847A"/>
<path d="M42 -14C44 -26 42 -34 37 -40L33 -38C37 -32 39 -24 40 -14Z" fill="#6A635A"/>
<g fill="none" stroke-linecap="round">
<path d="M-22 -45C-18 -58 -8 -68 4 -72" stroke="#4A3D33" stroke-width="2"/>
<path d="M-12 -45C-6 -58 4 -65 18 -67" stroke="#5A4C40" stroke-width="1.8"/>
<path d="M2 -42C8 -56 18 -62 30 -61" stroke="#4A3D33" stroke-width="1.8"/>
<path d="M14 -45C22 -54 30 -56 37 -51" stroke="#3B3029" stroke-width="1.6"/>
<path d="M-10 -62C-2 -69 8 -72 18 -72" stroke="#8C7B6A" stroke-width="1.3"/>
<path d="M-24 -68C-14 -76 -4 -78 6 -78C16 -77 24 -72 30 -66" stroke="#C9A27A" stroke-width="1.3" opacity=".32"/>
</g>
</g>
<rect width="240" height="300" fill="url(#${ch})"/>
</svg>`;
}

export function lucien() {
  const oG = uid('lo'), oD = uid('lo'), ch = uid('lc'), pe = uid('lp');
  const s0 = '#3A2418', s1 = '#74482F', s4 = '#F2C7A0';
  return `<svg viewBox="0 0 240 300" class="portrait" aria-hidden="true">
<defs>${chute(ch, 0.7, 0.85)}${peau(pe, '#E2AC84', '#BF8661')}</defs>
<g data-part="corps">
<path d="M4 300C8 262 28 240 62 230C80 225 92 220 100 216L140 216C148 220 160 225 178 230C212 240 232 262 236 300Z" fill="#9A8F80"/>
<path d="M6 292C10 264 30 244 62 234C80 229 92 223 100 219L104 224C94 232 82 240 66 246C44 254 28 270 22 296Z" fill="#E6DCCB"/>
<path d="M234 292C230 264 210 244 178 234C160 229 148 223 140 219L136 224C146 232 158 240 174 246C196 254 212 270 218 296Z" fill="#C4B9A8"/>
<path d="M44 300C48 270 60 248 84 236L101 228L120 270L139 228L156 236C180 248 192 270 196 300Z" fill="#141110"/>
<path d="M50 296C54 272 64 254 84 242M190 296C186 272 176 254 156 242" stroke="#3A332E" stroke-width="1.6" fill="none"/>
<path d="M101 228L120 270L139 228C132 234 108 234 101 228Z" fill="#D8CCBA"/>
<path d="M120 236V268" stroke="#A3978A" stroke-width="1.2"/>
<circle cx="120" cy="280" r="2.6" fill="#2A2421"/><circle cx="120" cy="294" r="2.6" fill="#2A2421"/>
<circle cx="119.3" cy="279.3" r=".9" fill="#7A6E66"/><circle cx="119.3" cy="293.3" r=".9" fill="#7A6E66"/>
<path d="M97 205C105 214 135 214 143 205L147 221C136 228 104 228 93 221Z" fill="#8C8173"/>
<path d="M97 205C105 212 135 212 143 205L144 211C135 218 105 218 96 211Z" fill="#E6DCCB"/>
<path d="M104 214L97 231L114 225Z" fill="#EDE4D5"/><path d="M136 214L143 231L126 225Z" fill="#CFC4B3"/>
<path d="M120 222C112 213 101 213 99 222C101 231 112 231 120 222Z" fill="#0E0B0A"/>
<path d="M120 222C128 213 139 213 141 222C139 231 128 231 120 222Z" fill="#0E0B0A"/>
<path d="M103 218C107 216 112 217 115 220M137 218C133 216 128 217 125 220" stroke="#3A3330" stroke-width="1.3" fill="none"/>
<rect x="115.5" y="217" width="9" height="10" rx="2.4" fill="#1A1514"/>
</g>
<g data-part="tete" transform="translate(120 112)">
<path d="M-22 48C-23 62 -25 80 -29 100L29 100C25 80 23 62 22 48Z" fill="${s0}"/>
<path d="M-41 -8C-50 -12 -54 -2 -52 12C-51 25 -46 34 -40 34Z" fill="${s1}"/>
<path d="M41 -8C50 -12 54 -2 52 12C51 25 46 34 40 34Z" fill="#55331F"/>
<path d="M-47 2C-49 10 -47 19 -43 24" stroke="${s0}" stroke-width="1.6" fill="none"/>
<path d="M0 -50C24 -50 39 -41 41 -24C43 -8 43 8 42 18C41 36 37 50 30 60C23 71 13 80 0 82C-13 80 -23 71 -30 60C-37 50 -41 36 -42 18C-43 8 -43 -8 -41 -24C-39 -41 -24 -50 0 -50Z" fill="url(#${pe})"/>
<path d="M36 -40C42 -24 43 0 42 18C41 36 37 50 30 60C23 71 13 80 0 82C9 76 16 68 21 60C26 52 26 42 26 34C26 26 30 18 33 10C36 0 34 -16 30 -30Z" fill="${s1}"/>
<path d="M-36 -40C-42 -24 -43 0 -42 18C-41 36 -37 50 -30 60C-23 71 -13 80 0 82C-9 76 -16 68 -21 60C-26 52 -26 42 -26 34C-26 26 -30 18 -33 10C-36 0 -34 -16 -30 -30Z" fill="${s1}" opacity=".82"/>
<path d="M-14 76C-6 81 6 81 14 76C9 83 4 85 0 85C-4 85 -9 83 -14 76Z" fill="${s0}"/>
<path d="M-36 -43C-22 -49 22 -49 36 -43C24 -45 -24 -45 -36 -43Z" fill="${s1}" opacity=".6"/>
<path d="M-15 -42C-6 -45 6 -45 15 -42L13 -32C4 -34 -4 -34 -13 -32Z" fill="${s4}" opacity=".5"/>
<path d="M-17 -30C-6 -32 6 -32 17 -30M-13 -24C-4 -25.5 4 -25.5 13 -24" stroke="${s1}" stroke-width="1" fill="none" opacity=".5"/>
<path d="M5 -9C12 -12 24 -13 31 -8C30 -2 27 3 22 6C16 7 10 6 6 3C4 0 4 -4 5 -9Z" fill="${s1}"/>
<path d="M-5 -9C-12 -12 -24 -13 -31 -8C-30 -2 -27 3 -22 6C-16 7 -10 6 -6 3C-4 0 -4 -4 -5 -9Z" fill="${s1}"/>
<path d="M6 -9C13 -11 24 -11 30 -7C25 -5 16 -5 8 -4Z" fill="${s0}" opacity=".8"/>
<path d="M-6 -9C-13 -11 -24 -11 -30 -7C-25 -5 -16 -5 -8 -4Z" fill="${s0}" opacity=".8"/>
<path d="M18 12C26 10 33 12 36 16C33 22 26 26 19 24C16 20 16 15 18 12Z" fill="${s4}" opacity=".35"/>
<path d="M-18 12C-26 10 -33 12 -36 16C-33 22 -26 26 -19 24C-16 20 -16 15 -18 12Z" fill="${s4}" opacity=".35"/>
<ellipse cx="-22" cy="22" rx="10" ry="7" fill="#C2664A" opacity=".16"/><ellipse cx="22" cy="22" rx="10" ry="7" fill="#C2664A" opacity=".14"/>
<path d="M4 -2C6 10 9 22 11 31C9 35 7 37 5 37C5 26 4 12 3 0Z" fill="${s1}"/>
<path d="M-4 -2C-6 10 -9 22 -11 31C-9 35 -7 37 -5 37C-5 26 -4 12 -3 0Z" fill="${s1}" opacity=".7"/>
<path d="M-1 -4L1 -4L2 20L-2 20Z" fill="${s4}" opacity=".6"/>
<ellipse cx="0" cy="30" rx="7" ry="5" fill="#C2664A" opacity=".2"/>
<ellipse cx="0" cy="29.5" rx="4.4" ry="3.4" fill="${s4}" opacity=".9"/>
<path d="M-12 33C-16 28 -12 23 -7 26M12 33C16 28 12 23 7 26" stroke="${s1}" stroke-width="1.6" fill="none"/>
<path d="M-11 35C-6 41 6 41 11 35C9 42 4 45 0 45C-4 45 -9 42 -11 35Z" fill="${s0}"/>
<path d="M-10 42C-4 46 4 46 10 42C11 46 10 50 9 51L-9 51C-10 50 -11 46 -10 42Z" fill="${s1}"/>
<path d="M11 34C19 40 22 49 19 61C18 51 15 43 9 38Z" fill="${s1}"/>
<path d="M-11 34C-19 40 -22 49 -19 61C-18 51 -15 43 -9 38Z" fill="${s1}"/>
<path d="M21 40C24 47 24 54 21 61M-21 40C-24 47 -24 54 -21 61" stroke="${s4}" stroke-width="1" fill="none" opacity=".45"/>
<g data-part="bouche">
<path d="M-15 51C-9 48.5 -3 49.5 0 50.5C3 49.5 9 48.5 15 51C10 53 4 54 0 54C-4 54 -10 53 -15 51Z" fill="${s1}"/>
<path d="M-17 49.5C-9 55.5 9 55.5 17 49.5" stroke="#170D09" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M-7 56C-2 57.4 3 57.4 8 56L7 58.6C2 59.8 -2 59.8 -6 58.6Z" fill="${s4}" opacity=".85"/>
</g>
<path d="M-10 60C-4 63 4 63 10 60C8 65 4 67 0 67C-4 67 -8 65 -10 60Z" fill="${s1}"/>
<g data-part="yeux">
${oeil({ x: -17, y: 1, l: 14, h: 5, regard: [0, 0.3], paupiere: 0.3, id: oG })}
${oeil({ x: 17, y: 1, l: 14, h: 5, regard: [0, 0.3], paupiere: 0.3, id: oD })}
</g>
<path d="M-24 5C-20 7.5 -14 7.5 -10 5M24 5C20 7.5 14 7.5 10 5" stroke="${s1}" stroke-width="1.2" fill="none"/>
<path d="M-26 9C-21 12 -14 12 -9 9M26 9C21 12 14 12 9 9" stroke="${s1}" stroke-width="1" fill="none" opacity=".7"/>
<path d="M-27 0l-5 -2M-27 3.5l-5 0.5M-26 6.5l-4 2.5M27 0l5 -2M27 3.5l5 .5M26 6.5l4 2.5" stroke="${s1}" stroke-width="1.1" fill="none"/>
<g data-part="sourcils">
<path d="M-5 -13C-12 -20 -26 -21 -36 -14C-30 -15 -22 -15 -16 -13C-12 -12 -8 -11 -6 -9Z" fill="#B9B1A6"/>
<path d="M5 -13C12 -20 26 -21 36 -14C30 -15 22 -15 16 -13C12 -12 8 -11 6 -9Z" fill="#B9B1A6"/>
<path d="M-6 -10C-14 -14 -26 -15 -35 -13M6 -10C14 -14 26 -15 35 -13" stroke="#6E675F" stroke-width="1.4" fill="none"/>
<path d="M-12 -16l-6 -2M-22 -17l-6 0M12 -16l6 -2M22 -17l6 0" stroke="#E4DED4" stroke-width=".9" fill="none"/>
</g>
<path d="M-44 -12C-48 -50 -26 -80 0 -81C26 -80 48 -50 44 -12C42 -26 39 -36 34 -42C24 -48 12 -49 2 -48C-10 -48 -24 -46 -34 -41C-39 -34 -42 -24 -44 -12Z" fill="#8F887E"/>
<path d="M-36 -46C-30 -66 -14 -78 4 -79C22 -78 36 -66 40 -48C30 -58 18 -63 4 -63C-12 -62 -26 -56 -36 -46Z" fill="#C8C1B7"/>
<path d="M-42 -16C-43 -8 -42 0 -40 4L-38 2C-39 -4 -40 -10 -40 -16Z" fill="#8F887E"/>
<path d="M42 -16C43 -8 42 0 40 4L38 2C39 -4 40 -10 40 -16Z" fill="#6F685F"/>
<g fill="none" stroke-linecap="round">
<path d="M-20 -64C-8 -72 8 -74 22 -70M-14 -56C-2 -62 12 -63 26 -60" stroke="#E8E2D9" stroke-width="1.3"/>
<path d="M-18 -48C-16 -60 -12 -70 -6 -78" stroke="#5E574F" stroke-width="1.4"/>
<path d="M-30 -44C-26 -56 -18 -64 -8 -70M10 -48C16 -58 24 -62 32 -60" stroke="#6F685F" stroke-width="1.2"/>
<path d="M-26 -70C-16 -78 -4 -80 8 -80C18 -79 27 -75 33 -69" stroke="#E9D3B4" stroke-width="1.2" opacity=".35"/>
</g>
</g>
<rect width="240" height="300" fill="url(#${ch})"/>
</svg>`;
}

export function odette() {
  const oG = uid('oo'), oD = uid('oo'), ch = uid('oc'), pe = uid('op');
  const s0 = '#3E2620', s1 = '#7B5244', s4 = '#F7D9C3';
  const perles = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12, x = 92 + 56 * t, y = 224 + Math.sin(t * Math.PI) * 13;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#E6DED0"/><circle cx="${(x - 0.8).toFixed(1)}" cy="${(y - 0.9).toFixed(1)}" r=".8" fill="#FFFFFF"/>`;
  }).join('');
  return `<svg viewBox="0 0 240 300" class="portrait" aria-hidden="true">
<defs>${chute(ch, 0.68, 0.88)}${peau(pe, '#ECC4A8', '#C99B7F')}</defs>
<g data-part="corps">
<path d="M10 300C16 262 36 242 68 232C86 227 98 222 104 214L136 214C142 222 154 227 172 232C204 242 224 262 230 300Z" fill="#181312"/>
<path d="M12 292C18 264 38 245 68 235C86 230 97 224 103 217L107 222C98 231 86 238 70 244C48 252 32 268 25 296Z" fill="#3B3230"/>
<path d="M228 292C222 264 202 245 172 235C154 230 143 224 137 217L133 222C142 231 154 238 170 244C192 252 208 268 215 296Z" fill="#2E2725"/>
<path d="M100 194C106 203 134 203 140 194L144 218C134 225 106 225 96 218Z" fill="#221B19"/>
<path d="M100 194C106 201 134 201 140 194L141 200C134 207 106 207 99 200Z" fill="#4A3F3B"/>
${perles}
</g>
<g data-part="tete" transform="translate(120 116)">
<path d="M-15 44C-16 58 -18 76 -22 96L22 96C18 76 16 58 15 44Z" fill="${s0}"/>
<path d="M-46 40C-54 0 -46 -60 0 -66C46 -60 54 0 46 40C44 46 38 48 32 44L-32 44C-38 48 -44 46 -46 40Z" fill="#5E5850"/>
<path d="M0 -46C20 -46 33 -38 35 -22C37 -8 37 6 36 15C35 30 32 42 26 52C20 63 11 72 0 74C-11 72 -20 63 -26 52C-32 42 -35 30 -36 15C-37 6 -37 -8 -35 -22C-33 -38 -20 -46 0 -46Z" fill="url(#${pe})"/>
<path d="M30 -30C35 -16 37 2 36 15C35 30 32 42 26 52C20 63 11 72 0 74C8 68 14 60 18 52C22 44 22 36 22 28C22 20 26 14 28 6C30 -4 30 -18 26 -28Z" fill="${s1}"/>
<path d="M-30 -30C-35 -16 -37 2 -36 15C-35 30 -32 42 -26 52C-20 63 -11 72 0 74C-8 68 -14 60 -18 52C-22 44 -22 36 -22 28C-22 20 -26 14 -28 6C-30 -4 -30 -18 -26 -28Z" fill="${s1}" opacity=".8"/>
<path d="M-11 69C-5 74 5 74 11 69C7 75 3 77 0 77C-3 77 -7 75 -11 69Z" fill="${s0}"/>
<path d="M4 -8C10 -11 21 -12 28 -7C27 -1 24 3 19 5C14 6 9 5 5 2C3 -1 3 -4 4 -8Z" fill="${s1}" opacity=".85"/>
<path d="M-4 -8C-10 -11 -21 -12 -28 -7C-27 -1 -24 3 -19 5C-14 6 -9 5 -5 2C-3 -1 -3 -4 -4 -8Z" fill="${s1}" opacity=".85"/>
<path d="M17 12C23 10 29 12 31 16C28 20 23 22 18 21C16 18 15 15 17 12Z" fill="${s4}" opacity=".45"/>
<path d="M-17 12C-23 10 -29 12 -31 16C-28 20 -23 22 -18 21C-16 18 -15 15 -17 12Z" fill="${s4}" opacity=".45"/>
<path d="M3 -2C5 9 7 19 8 27C7 30 5 32 3.5 32C3.5 22 3 10 2.5 0Z" fill="${s1}"/>
<path d="M-3 -2C-5 9 -7 19 -8 27C-7 30 -5 32 -3.5 32C-3.5 22 -3 10 -2.5 0Z" fill="${s1}" opacity=".6"/>
<path d="M-.8 -3L.8 -3L1.4 20L-1.4 20Z" fill="${s4}" opacity=".7"/>
<ellipse cx="0" cy="26" rx="3" ry="2.4" fill="${s4}"/>
<path d="M-8 30C-4 35 4 35 8 30C6 36 3 38 0 38C-3 38 -6 36 -8 30Z" fill="${s0}"/>
<path d="M-7 36C-3 39 3 39 7 36C8 40 7 43 6 44L-6 44C-7 43 -8 40 -7 36Z" fill="${s1}" opacity=".8"/>
<path d="M8 30C14 36 16 44 14 53M-8 30C-14 36 -16 44 -14 53" stroke="${s1}" stroke-width="1.3" fill="none"/>
<path d="M-4 40.5l-.6 -2.6M0 40.8v-2.8M4 40.5l.6 -2.6" stroke="${s1}" stroke-width=".7" fill="none" opacity=".6"/>
<g data-part="bouche">
<path d="M-11 46C-6 43.5 -2 44.5 0 45.5C2 44.5 6 43.5 11 46C7 48 3 49 0 49C-3 49 -7 48 -11 46Z" fill="#7A1C1A"/>
<path d="M-10 47.2C-5 48.8 5 48.8 11 46.4C8 52 4 54 0 54C-4 54 -8 52 -10 47.2Z" fill="#9E2F25"/>
<path d="M-5 49.5C-2 50.4 2 50.4 6 49.2L5 51.3C2 52.1 -1.5 52.1 -4 51.3Z" fill="#D06A55" opacity=".8"/>
<path d="M-11.5 46.6C-5 49 5 48.8 12 45.6" stroke="#2A0E0C" stroke-width="1.2" fill="none" stroke-linecap="round"/>
</g>
<path d="M-8 56C-3 58.5 3 58.5 8 56C6 60 3 62 0 62C-3 62 -6 60 -8 56Z" fill="${s1}" opacity=".85"/>
<g data-part="yeux">
${oeil({ x: -15, y: 0, l: 13, h: 5, regard: [0.3, -0.4], paupiere: 0.28, blanc: '#B0A193', id: oG })}
${oeil({ x: 15, y: 0, l: 13, h: 5, regard: [0.3, -0.4], paupiere: 0.28, blanc: '#B0A193', id: oD })}
</g>
<path d="M-22 4C-17 6.5 -12 6.5 -8 4M22 4C17 6.5 12 6.5 8 4" stroke="${s1}" stroke-width="1" fill="none" opacity=".8"/>
<path d="M-24 -1l-4 -2M-24 2l-4 .5M24 -1l4 -2M24 2l4 .5" stroke="${s1}" stroke-width="1" fill="none"/>
<g data-part="sourcils">
<path d="M-5 -10C-11 -16 -22 -17 -29 -11L-28 -9.5C-21 -14 -12 -13.5 -6 -8.5Z" fill="#5E5248"/>
<path d="M5 -10C11 -16 22 -17 29 -11L28 -9.5C21 -14 12 -13.5 6 -8.5Z" fill="#5E5248"/>
</g>
<g data-part="lunettes">
<path d="M3 11C9 7 24 5 33 2C33 10 30 18 22 19.5C14 21 6 18 3 11Z" fill="#FFF4E6" opacity=".07"/>
<path d="M-3 11C-9 7 -24 5 -33 2C-33 10 -30 18 -22 19.5C-14 21 -6 18 -3 11Z" fill="#FFF4E6" opacity=".07"/>
<path d="M3 11C9 7 24 5 33 2C33 10 30 18 22 19.5C14 21 6 18 3 11ZM-3 11C-9 7 -24 5 -33 2C-33 10 -30 18 -22 19.5C-14 21 -6 18 -3 11ZM-3 11C-1.5 9 1.5 9 3 11" stroke="#3A2214" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
<path d="M29 3C30 2 32 1.5 33 2M-29 3C-30 2 -32 1.5 -33 2" stroke="#B07A45" stroke-width="1.2" fill="none"/>
<path d="M9 9.5L15 8.5M-25 6L-19 5.5" stroke="#FFFFFF" stroke-width="1.1" opacity=".55" stroke-linecap="round"/>
</g>
<path d="M-46 40C-54 0 -46 -60 0 -66C46 -60 54 0 46 40C44 46 38 48 32 44C36 30 37 10 34 -10C28 -30 14 -40 -4 -40C-20 -38 -30 -28 -34 -10C-37 10 -36 30 -32 44C-38 48 -44 46 -46 40Z" fill="#8D877E"/>
<path d="M-44 30C-50 -4 -42 -52 0 -60C38 -54 50 -10 46 26C44 6 40 -14 32 -28C24 -40 10 -46 -4 -46C-22 -44 -36 -32 -40 -12C-43 2 -44 16 -44 30Z" fill="#C9C3BA"/>
<path d="M-12 -60C6 -56 24 -44 34 -20C26 -30 14 -38 0 -40C-6 -40 -10 -38 -14 -36Z" fill="#B3ADA4"/>
<path d="M-10 -58C6 -54 20 -44 28 -30" stroke="#ECE6DD" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M-30 -48C-20 -58 -6 -62 8 -61M-40 -20C-40 -34 -32 -46 -20 -54M38 -14C38 -30 30 -44 18 -52" stroke="#ECE6DD" stroke-width="1.1" fill="none" opacity=".8" stroke-linecap="round"/>
<path d="M-12 -61C-14 -52 -14 -44 -12 -38" stroke="#6B655D" stroke-width="1.2" fill="none"/>
<circle cx="-37" cy="47" r="3.4" fill="#E6DED0"/><circle cx="-38" cy="46" r="1" fill="#FFFFFF"/>
<circle cx="37" cy="47" r="3.4" fill="#C9C1B3"/><circle cx="36" cy="46" r="1" fill="#FFFFFF"/>
</g>
<rect width="240" height="300" fill="url(#${ch})"/>
</svg>`;
}

export function kiki() {
  const oG = uid('ko'), oD = uid('ko'), ch = uid('kc'), pe = uid('kp'), lu = uid('kl'), lt = uid('kt');
  const s0 = '#24150D', s1 = '#4C2D1B', s4 = '#CF9468';
  return `<svg viewBox="0 0 240 300" class="portrait" aria-hidden="true">
<defs>${chute(ch, 0.7, 0.85)}${peau(pe, '#AE734C', '#8A5636')}
<radialGradient id="${lu}" cx="0.5" cy="1" r="0.75"><stop offset="0" stop-color="#CFE0FF" stop-opacity=".4"/><stop offset="1" stop-color="#CFE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="${lt}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#CFE0FF" stop-opacity=".35"/><stop offset="1" stop-color="#CFE0FF" stop-opacity="0"/></radialGradient></defs>
<g data-part="corps">
<path d="M6 300C10 262 30 242 64 232C82 227 94 222 102 216L138 216C146 222 158 227 176 232C210 242 230 262 234 300Z" fill="#2C311F"/>
<path d="M8 292C12 264 32 245 64 235C82 230 93 224 101 218L105 224C95 232 83 240 67 246C45 254 29 270 22 296Z" fill="#525C3A"/>
<path d="M232 292C228 264 208 245 176 235C158 230 147 224 139 218L135 224C145 232 157 240 173 246C195 254 211 270 218 296Z" fill="#3E4630"/>
<path d="M104 232L136 232L132 300L108 300Z" fill="#222327"/>
<path d="M92 206C100 222 140 222 148 206C156 214 154 228 146 234C134 242 106 242 94 234C86 228 84 214 92 206Z" fill="#2B2C31"/>
<path d="M92 206C100 219 140 219 148 206C151 209 152 213 151 216C142 228 98 228 89 216C88 213 89 209 92 206Z" fill="#4B4D55"/>
<path d="M112 240C111 252 111 262 112 272M128 240C129 252 129 262 128 272" stroke="#C9C9CC" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M100 222C108 236 132 236 140 222" stroke="#C99A3E" stroke-width="1.8" fill="none" stroke-dasharray="2.2 1.2"/>
<ellipse cx="96" cy="280" rx="46" ry="30" fill="url(#${lt})"/>
<rect x="80" y="262" width="34" height="56" rx="6" fill="#0E0E10"/>
<path d="M84 263H110" stroke="#CFE0FF" stroke-width="1.4" opacity=".6"/>
<circle cx="88" cy="272" r="3.2" fill="#1E1E22"/><circle cx="88" cy="272" r="1.6" fill="#2E3440"/><circle cx="96" cy="272" r="2.4" fill="#1E1E22"/>
</g>
<g data-part="tete" transform="translate(120 112)">
<path d="M-18 46C-19 60 -21 78 -25 98L25 98C21 78 19 60 18 46Z" fill="${s0}"/>
<path d="M-38 -8C-46 -12 -50 -2 -48 10C-47 22 -43 30 -37 31Z" fill="${s1}"/>
<path d="M38 -8C46 -12 50 -2 48 10C47 22 43 30 37 31Z" fill="#3A2214"/>
<path d="M0 -48C21 -48 35 -40 37 -24C40 -8 40 6 39 16C38 32 35 44 29 54C23 64 13 74 0 76C-13 74 -23 64 -29 54C-35 44 -38 32 -39 16C-40 6 -40 -8 -37 -24C-35 -40 -21 -48 0 -48Z" fill="url(#${pe})"/>
<path d="M33 -38C38 -22 40 0 39 16C38 32 35 44 29 54C23 64 13 74 0 76C8 70 14 62 18 54C22 46 22 38 21 30C20 22 25 14 28 8C31 -2 30 -16 27 -28Z" fill="${s1}"/>
<path d="M-33 -38C-38 -22 -40 0 -39 16C-38 32 -35 44 -29 54C-23 64 -13 74 0 76C-8 70 -14 62 -18 54C-22 46 -22 38 -21 30C-20 22 -25 14 -28 8C-31 -2 -30 -16 -27 -28Z" fill="${s1}" opacity=".85"/>
<path d="M5 -8C12 -11 23 -12 30 -7C29 -1 26 3 21 5C15 6 10 5 6 2C4 -1 4 -4 5 -8Z" fill="${s1}"/>
<path d="M-5 -8C-12 -11 -23 -12 -30 -7C-29 -1 -26 3 -21 5C-15 6 -10 5 -6 2C-4 -1 -4 -4 -5 -8Z" fill="${s1}"/>
<path d="M19 13C25 11 31 12 34 15C30 17 25 18 20 17Z" fill="${s4}" opacity=".55"/>
<path d="M-19 13C-25 11 -31 12 -34 15C-30 17 -25 18 -20 17Z" fill="${s4}" opacity=".55"/>
<path d="M4 -2C6 9 8 20 10 29C8 33 6 35 4 35C4 24 3.5 11 3 0Z" fill="${s1}"/>
<path d="M-4 -2C-6 9 -8 20 -10 29C-8 33 -6 35 -4 35C-4 24 -3.5 11 -3 0Z" fill="${s1}" opacity=".7"/>
<path d="M-1 -4L1 -4L1.8 19L-1.8 19Z" fill="${s4}" opacity=".6"/>
<ellipse cx="0" cy="28" rx="4.2" ry="3" fill="${s4}" opacity=".85"/>
<path d="M-12 31C-15 26 -11 22 -7 24M12 31C15 26 11 22 7 24" stroke="${s1}" stroke-width="1.5" fill="none"/>
<path d="M-11 33C-6 38 6 38 11 33C9 39 4 42 0 42C-4 42 -9 39 -11 33Z" fill="${s0}"/>
<path d="M10 32C16 38 18 46 16 55M-10 32C-16 38 -18 46 -16 55" stroke="${s1}" stroke-width="1.3" fill="none"/>
<g data-part="bouche">
<path d="M-13 49C-7 46.5 -3 47.5 0 48.5C3 47.5 7 46.5 13 49C9 51 4 52 0 52C-4 52 -9 51 -13 49Z" fill="#5A3322"/>
<path d="M-13 49.5C-7 52.5 6 52.5 14 47.5" stroke="#160C07" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M-7 53.5C-2 55 3 55 8 53.4L7 56C2 57.2 -2 57.2 -6 56Z" fill="${s4}" opacity=".75"/>
</g>
<path d="M-37 22C-36 36 -31 48 -24 58C-16 68 -8 73 0 74C8 73 16 68 24 58C31 48 36 36 37 22C33 32 30 42 24 50C18 58 10 62 0 62C-10 62 -18 58 -24 50C-30 42 -33 32 -37 22Z" fill="#170E09" opacity=".88"/>
<path d="M-9 59C-4 61.5 4 61.5 9 59L8 71C4 73 -4 73 -8 71Z" fill="#170E09" opacity=".88"/>
<path d="M-14 44C-8 41 -3 41 0 42C3 41 8 41 14 44L13 46.5C8 45 3 45 0 46C-3 45 -8 45 -13 46.5Z" fill="#170E09" opacity=".9"/>
<g data-part="lueur">
<ellipse cx="0" cy="72" rx="30" ry="14" fill="url(#${lu})" opacity=".45"/>
<path d="M-8 56.5C-3 58 3 58 8 56.3M-6 40.5C-2 41.8 2 41.8 6 40.5" stroke="#CFE0FF" stroke-width="1" fill="none" opacity=".35"/>
</g>
<g data-part="yeux">
${oeil({ x: -16, y: 1, l: 14, h: 5.2, regard: [-1.2, 1.8], paupiere: 0.5, id: oG })}
${oeil({ x: 16, y: 1, l: 14, h: 5.2, regard: [-1.2, 1.8], paupiere: 0.5, id: oD })}
</g>
<g data-part="sourcils">
<path d="M-5 -10C-12 -14 -24 -15 -33 -11L-32 -7.5C-24 -11 -13 -11 -6 -7Z" fill="#120C09"/>
<path d="M5 -10C12 -14 24 -15 33 -11L32 -7.5C24 -11 13 -11 6 -7Z" fill="#120C09"/>
</g>
<path d="M-37 -20C-40 -48 -22 -63 0 -63C22 -63 40 -48 37 -20C34 -32 28 -40 20 -43C10 -46 -10 -46 -20 -43C-28 -40 -34 -32 -37 -20Z" fill="#0F0B09"/>
<path d="M-39 -8C-40 -18 -38 -27 -35 -32L-33 -12Z" fill="#1A1310" opacity=".7"/>
<path d="M39 -8C40 -18 38 -27 35 -32L33 -12Z" fill="#1A1310" opacity=".7"/>
<g stroke="#3A302A" stroke-width="1.2" stroke-linecap="round" fill="none">
<path d="M-24 -50l3 -5M-16 -54l3 -5M-8 -56l3 -5M0 -57l3 -5M8 -56l3 -5M16 -54l3 -5M24 -50l3 -4"/>
<path d="M-20 -46l2 -4M-12 -49l2 -4M-4 -50l2 -4M4 -50l2 -4M12 -49l2 -4M20 -46l2 -4" opacity=".7"/>
</g>
<circle cx="-41" cy="14" r="2.8" fill="#E9E9EA"/><circle cx="-41.8" cy="13.2" r=".9" fill="#FFFFFF"/>
</g>
<rect width="240" height="300" fill="url(#${ch})"/>
</svg>`;
}

export function notaire() {
  const oG = uid('no'), oD = uid('no'), ch = uid('nc'), pe = uid('np'), cr = uid('nk'), ve = uid('nv');
  const s0 = '#36221A', s1 = '#6E4936', s4 = '#EECBAE';
  return `<svg viewBox="0 0 240 300" class="portrait" aria-hidden="true">
<defs>${chute(ch, 0.68, 0.88)}${peau(pe, '#D9AB89', '#AF8364')}
<linearGradient id="${cr}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9C4A4"/><stop offset="1" stop-color="#C79A78"/></linearGradient>
<linearGradient id="${ve}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7EC" stop-opacity=".75"/><stop offset=".55" stop-color="#FFF7EC" stop-opacity=".35"/><stop offset="1" stop-color="#FFF7EC" stop-opacity=".05"/></linearGradient></defs>
<g data-part="corps">
<path d="M6 300C10 262 30 242 64 232C82 227 94 221 102 215L138 215C146 221 158 227 176 232C210 242 230 262 234 300Z" fill="#25262A"/>
<path d="M8 292C12 264 32 245 64 235C82 230 93 223 101 217L105 223C95 231 83 239 67 245C45 253 29 269 22 296Z" fill="#4A4C53"/>
<path d="M232 292C228 264 208 245 176 235C158 230 147 223 139 217L135 223C145 231 157 239 173 245C195 253 211 269 218 296Z" fill="#383A40"/>
<path d="M104 214L120 264L136 214Z" fill="#D9D3C9"/>
<path d="M102 216L86 270L96 276L92 300L112 300L120 278Z" fill="#1E1F23"/>
<path d="M138 216L154 270L144 276L148 300L128 300L120 278Z" fill="#1E1F23"/>
<path d="M101 218L86 270M139 218L154 270" stroke="#5A5C63" stroke-width="1.2" fill="none"/>
<path d="M114 222L126 222L124 232L130 270L120 284L110 270L116 232Z" fill="#1C2236"/>
<path d="M113 213L127 213L124 226L116 226Z" fill="#283150"/>
<rect x="110" y="250" width="20" height="3" rx="1" fill="#B9BBC0"/>
<path d="M100 204C108 213 132 213 140 204L144 220C134 227 106 227 96 220Z" fill="#8E897F"/>
<path d="M100 204C108 211 132 211 140 204L141 210C132 217 108 217 99 210Z" fill="#E2DDD4"/>
<path d="M104 213L98 229L114 223Z" fill="#E8E3DA"/><path d="M136 213L142 229L126 223Z" fill="#C9C3B9"/>
</g>
<g data-part="tete" transform="translate(120 118)">
<path d="M-19 48C-20 62 -22 78 -26 96L26 96C22 78 20 62 19 48Z" fill="${s0}"/>
<path d="M-16 58C-10 62 -6 70 -8 80M16 58C10 62 6 70 8 80" stroke="#22140F" stroke-width="1.2" fill="none" opacity=".7"/>
<path d="M-38 -10C-48 -14 -52 -2 -50 12C-49 26 -44 34 -37 34Z" fill="${s1}"/>
<path d="M38 -10C48 -14 52 -2 50 12C49 26 44 34 37 34Z" fill="#55362A"/>
<path d="M-38 -26C-40 -60 -22 -86 0 -87C22 -86 40 -60 38 -26Z" fill="url(#${cr})"/>
<path d="M0 -54C22 -54 36 -44 38 -26C40 -10 40 6 39 18C38 36 34 50 28 60C22 70 12 78 0 80C-12 78 -22 70 -28 60C-34 50 -38 36 -39 18C-40 6 -40 -10 -38 -26C-36 -44 -22 -54 0 -54Z" fill="url(#${pe})"/>
<path d="M33 -48C39 -30 40 -2 39 18C38 36 34 50 28 60C22 70 12 78 0 80C8 74 14 66 18 58C22 50 22 40 21 32C20 24 24 16 27 10C30 0 30 -24 28 -40Z" fill="${s1}"/>
<path d="M-33 -48C-39 -30 -40 -2 -39 18C-38 36 -34 50 -28 60C-22 70 -12 78 0 80C-8 74 -14 66 -18 58C-22 50 -22 40 -21 32C-20 24 -24 16 -27 10C-30 0 -30 -24 -28 -40Z" fill="${s1}" opacity=".85"/>
<path d="M-12 74C-6 80 6 80 12 74C8 82 4 84 0 84C-4 84 -8 82 -12 74Z" fill="${s0}"/>
<ellipse cx="-6" cy="-70" rx="15" ry="7" fill="${s4}" opacity=".8"/>
<ellipse cx="-8" cy="-72" rx="7" ry="3" fill="#FFF0E0" opacity=".65"/>
<path d="M-20 -36C-8 -38 8 -38 20 -36M-17 -29C-6 -30.5 6 -30.5 17 -29M-13 -22C-4 -23 4 -23 13 -22" stroke="${s1}" stroke-width="1.1" fill="none" opacity=".55"/>
<path d="M5 -8C12 -11 24 -12 31 -7C30 -1 27 4 22 6C16 7 10 6 6 3C4 0 4 -4 5 -8Z" fill="${s0}" opacity=".85"/>
<path d="M-5 -8C-12 -11 -24 -12 -31 -7C-30 -1 -27 4 -22 6C-16 7 -10 6 -6 3C-4 0 -4 -4 -5 -8Z" fill="${s0}" opacity=".85"/>
<path d="M4 -2C6 10 8 24 10 34C8 38 6 40 4 40C4 28 3 12 3 0Z" fill="${s1}"/>
<path d="M-4 -2C-6 10 -8 24 -10 34C-8 38 -6 40 -4 40C-4 28 -3 12 -3 0Z" fill="${s1}" opacity=".7"/>
<path d="M-1 -4L1 -4L1.6 24L-1.6 24Z" fill="${s4}" opacity=".6"/>
<ellipse cx="0" cy="34" rx="3" ry="2.4" fill="${s4}" opacity=".85"/>
<path d="M-10 39C-6 44 6 44 10 39C8 45 4 48 0 48C-4 48 -8 45 -10 39Z" fill="${s0}"/>
<path d="M-9 45C-4 48 4 48 9 45C10 49 9 52 8 53L-8 53C-9 52 -10 49 -9 45Z" fill="${s1}"/>
<path d="M10 36C19 42 23 52 20 66C18 55 15 46 8 41Z" fill="${s0}" opacity=".8"/>
<path d="M-10 36C-19 42 -23 52 -20 66C-18 55 -15 46 -8 41Z" fill="${s0}" opacity=".8"/>
<path d="M22 44C25 52 25 60 22 68M-22 44C-25 52 -25 60 -22 68" stroke="${s4}" stroke-width="1" fill="none" opacity=".4"/>
<path d="M20 66C16 72 10 75 4 76M-20 66C-16 72 -10 75 -4 76" stroke="${s1}" stroke-width="1.2" fill="none" opacity=".7"/>
<g data-part="bouche">
<path d="M-12 56C-6 54.5 6 54.5 12 56C8 57 4 57.5 0 57.5C-4 57.5 -8 57 -12 56Z" fill="${s1}"/>
<path d="M-13 56.5C-6 57.6 6 57.6 13 56.5" stroke="#170D09" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M-6 59C-2 60 2 60 6 59L5 61C2 61.8 -2 61.8 -5 61Z" fill="${s4}" opacity=".7"/>
</g>
<path d="M-9 63C-4 65.5 4 65.5 9 63C7 67 4 69 0 69C-4 69 -7 67 -9 63Z" fill="${s1}"/>
<g data-part="yeux">
${oeil({ x: -16, y: 1, l: 13, h: 4.6, regard: [0, 0.4], paupiere: 0.55, id: oG })}
${oeil({ x: 16, y: 1, l: 13, h: 4.6, regard: [0, 0.4], paupiere: 0.55, id: oD })}
</g>
<g data-part="sourcils">
<path d="M-5 -10C-13 -13 -25 -13 -33 -10L-33 -6.5C-25 -9 -13 -9 -6 -6.5Z" fill="#7C766E"/>
<path d="M5 -10C13 -13 25 -13 33 -10L33 -6.5C25 -9 13 -9 6 -6.5Z" fill="#7C766E"/>
<path d="M-6 -6.5C-13 -9 -25 -9 -33 -6.5M6 -6.5C13 -9 25 -9 33 -6.5" stroke="#3E3A35" stroke-width="1.2" fill="none"/>
</g>
<g data-part="lunettes">
<rect x="-29" y="-6" width="24" height="14" rx="2.5" fill="url(#${ve})"/>
<rect x="5" y="-6" width="24" height="14" rx="2.5" fill="url(#${ve})"/>
<rect x="-29" y="-6" width="24" height="14" rx="2.5" fill="none" stroke="#C9CBD0" stroke-width=".9" opacity=".8"/>
<rect x="5" y="-6" width="24" height="14" rx="2.5" fill="none" stroke="#C9CBD0" stroke-width=".9" opacity=".8"/>
<path d="M-5 -1C-2 -3 2 -3 5 -1M-29 -2L-39 -4M29 -2L39 -4" stroke="#B9BBC0" stroke-width="1.1" fill="none"/>
</g>
<path d="M-40 -24C-44 -40 -40 -52 -34 -58C-38 -46 -38 -34 -36 -20Z" fill="#8E8880"/>
<path d="M40 -24C44 -40 40 -52 34 -58C38 -46 38 -34 36 -20Z" fill="#6E6860"/>
<path d="M-41 -20C-44 -12 -44 -2 -42 6L-38 2C-39 -6 -39 -14 -38 -20Z" fill="#8E8880"/>
<path d="M41 -20C44 -12 44 -2 42 6L38 2C39 -6 39 -14 38 -20Z" fill="#6E6860"/>
<path d="M-28 -80C-18 -86 -6 -88 6 -88C18 -87 28 -82 34 -75" stroke="#F2D9BE" stroke-width="1.2" fill="none" opacity=".4"/>
</g>
<rect width="240" height="300" fill="url(#${ch})"/>
</svg>`;
}
