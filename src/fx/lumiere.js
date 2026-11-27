// La lumière et les particules, avec PixiJS : un calque transparent au-dessus de la table.
// - la pénombre : un dégradé qui assombrit tout ce qui sort du rond de la lampe,
//   et qui se resserre sur les cartes à l'abattage ;
// - la poussière qui danse dans le cône ;
// - les éclats de lumière quand une carte gagnante se révèle ;
// - la pluie de jetons à la victoire.
// Le rendu suit le ticker de GSAP : une seule boucle d'animation pour tout le jeu.

import { Application, Container, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { mouvementReduit } from '../ui/outils.js';

function texture(taille, dessin) {
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  dessin(c.getContext('2d'), taille);
  return Texture.from(c);
}

const texturePenombre = () => texture(512, (g, t) => {
  const r = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
  r.addColorStop(0, 'rgba(8,5,3,0)');
  r.addColorStop(0.45, 'rgba(8,5,3,0)');
  r.addColorStop(0.75, 'rgba(8,5,3,0.55)');
  r.addColorStop(1, 'rgba(8,5,3,0.92)');
  g.fillStyle = r; g.fillRect(0, 0, t, t);
});

const textureHalo = (couleur = '255,226,170') => texture(128, (g, t) => {
  const r = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
  r.addColorStop(0, `rgba(${couleur},1)`);
  r.addColorStop(0.25, `rgba(${couleur},0.5)`);
  r.addColorStop(1, `rgba(${couleur},0)`);
  g.fillStyle = r; g.fillRect(0, 0, t, t);
});

const textureJeton = (c, l) => texture(64, (g, t) => {
  const m = t / 2;
  g.fillStyle = c; g.beginPath(); g.arc(m, m, m - 2, 0, Math.PI * 2); g.fill();
  g.fillStyle = l;
  for (let k = 0; k < 8; k++) {
    g.save(); g.translate(m, m); g.rotate((k / 8) * Math.PI * 2);
    g.fillRect(-4, -m + 2, 8, 9); g.restore();
  }
  g.strokeStyle = l; g.lineWidth = 2; g.setLineDash([3, 3]);
  g.beginPath(); g.arc(m, m, m * 0.55, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]); g.fillStyle = c; g.beginPath(); g.arc(m, m, m * 0.45, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(m, m, m - 2, 0, Math.PI * 2); g.stroke();
});

export class Lumiere {
  /**
   * @param {HTMLElement} parent
   * @param {{largeur:number, hauteur:number, centre:{x:number,y:number}, echelle:number}} o
   */
  async init(parent, { largeur, hauteur, centre, echelle }) {
    this.largeur = largeur; this.hauteur = hauteur;
    this.centre = { ...centre };
    this.reduit = mouvementReduit();
    const app = new Application();
    await app.init({
      width: largeur, height: hauteur, backgroundAlpha: 0, antialias: false,
      resolution: Math.min(2, window.devicePixelRatio || 1) * echelle, autoDensity: true,
      autoStart: false, sharedTicker: false, preference: 'webgl',
    });
    this.app = app;
    const c = app.canvas;
    c.classList.add('fx');
    Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: largeur + 'px', height: hauteur + 'px', pointerEvents: 'none', zIndex: 29 });
    parent.appendChild(c);

    this.penombre = new Sprite(texturePenombre());
    this.penombre.anchor.set(0.5);
    this.rayon = 330;
    this.intensite = 0.55;
    this.appliquerPenombre();
    app.stage.addChild(this.penombre);

    this.poussiere = new Container();
    this.poussiere.blendMode = 'add';
    app.stage.addChild(this.poussiere);
    const halo = textureHalo();
    this.grains = [];
    for (let i = 0; i < 46; i++) {
      const s = new Sprite(halo);
      s.anchor.set(0.5);
      this.poussiere.addChild(s);
      this.grains.push(this.nouveauGrain(s, true));
    }
    this.agitation = 0;

    this.eclats = new Container();
    this.eclats.blendMode = 'add';
    app.stage.addChild(this.eclats);
    this.textureEclat = textureHalo('255,236,200');

    this.pluie = new Container();
    app.stage.addChild(this.pluie);
    this.texturesJetons = [
      textureJeton('#D8442F', '#F2E8D5'), textureJeton('#E8AE3C', '#F2E8D5'),
      textureJeton('#1C1814', '#F2E8D5'), textureJeton('#F2E8D5', '#D8442F'),
    ];
    this.tombants = [];

    this.balance = 0;
    this.surBalance = null;
    this.boucle = (temps, delta) => this.maj(delta / 16.67);
    gsap.ticker.add(this.boucle);
    return this;
  }

  nouveauGrain(s, debut) {
    const y = debut ? 90 + Math.random() * (this.centre.y + 60) : this.centre.y + 40 + Math.random() * 40;
    const demi = 73 + (y - 76) * 0.29;
    const g = {
      s, y, x: this.largeur / 2 + (Math.random() * 2 - 1) * demi * 0.85,
      vx: (Math.random() - 0.5) * 0.06, vy: -(0.05 + Math.random() * 0.12),
      a: 0.18 + Math.random() * 0.4, t: Math.random() * 6.28, taille: 0.05 + Math.random() * 0.09,
    };
    s.scale.set(g.taille);
    return g;
  }

  appliquerPenombre() {
    const d = this.rayon * 2;
    this.penombre.width = d * 1.9;
    this.penombre.height = d * 1.9;
    this.penombre.position.set(this.centre.x + this.balance * -14, this.centre.y);
    this.penombre.alpha = this.intensite;
  }

  maj(dt) {
    if (!this.app) return;
    const cx = this.largeur / 2 - this.balance * 9;
    for (const g of this.grains) {
      if (!this.reduit) {
        g.t += 0.016 * dt;
        g.x += (g.vx + Math.sin(g.t) * 0.06 * (1 + this.agitation * 5)) * dt;
        g.y += g.vy * (1 + this.agitation * 7) * dt;
        if (g.y < 86) Object.assign(g, this.nouveauGrain(g.s, false));
      }
      const demi = 73 + (g.y - 76) * 0.29;
      const bord = Math.min(1, Math.max(0, 1 - Math.abs(g.x - cx) / demi) * 2.5);
      g.s.position.set(g.x, g.y);
      g.s.alpha = g.a * bord * (0.55 + 0.45 * Math.sin(g.t * 1.7));
    }
    this.agitation *= Math.pow(0.985, dt);

    for (let i = this.tombants.length - 1; i >= 0; i--) {
      const j = this.tombants[i];
      j.vy += 0.32 * dt;
      j.s.x += j.vx * dt; j.s.y += j.vy * dt;
      j.s.rotation += j.vr * dt;
      j.s.scale.y = j.echelle * Math.abs(Math.cos(j.s.rotation * 1.3));
      if (j.s.y > j.sol && j.vy > 0) {
        j.s.y = j.sol; j.vy *= -0.32; j.vx *= 0.6; j.rebonds++;
        if (j.rebonds > 2) j.vie = Math.min(j.vie, 20);
      }
      j.vie -= dt;
      if (j.vie < 20) j.s.alpha = Math.max(0, j.vie / 20);
      if (j.vie <= 0) { j.s.destroy(); this.tombants.splice(i, 1); }
    }
    this.app.render();
  }

  /** La lampe se balance (après un tapis) : la lumière part, revient, s'amortit. */
  balancer(force = 4.5) {
    this.agitation = 1;
    if (this.reduit) return;
    gsap.fromTo(this, { balance: force }, {
      balance: 0, duration: 3.6, ease: 'elastic.out(1, 0.16)',
      onUpdate: () => { this.appliquerPenombre(); this.surBalance?.(this.balance); },
    });
  }

  /** Resserre la lumière sur un point (abattage) ; relacher() la rend. */
  resserrer({ x, y }, rayon = 190, intensite = 0.9) {
    return gsap.to(this, {
      duration: 0.9, ease: 'power2.inOut', rayon, intensite,
      onUpdate: () => this.appliquerPenombre(),
      onStart: () => { this.centreCible = { x, y }; },
    });
  }

  relacher() {
    return gsap.to(this, { duration: 1.1, ease: 'power2.inOut', rayon: 330, intensite: 0.55, onUpdate: () => this.appliquerPenombre() });
  }

  /** Un éclat de lumière (carte gagnante, combinaison révélée). */
  eclat(x, y, taille = 1.4, duree = 0.9) {
    const s = new Sprite(this.textureEclat);
    s.anchor.set(0.5); s.position.set(x, y); s.alpha = 0; s.scale.set(taille * 0.3);
    this.eclats.addChild(s);
    gsap.timeline({ onComplete: () => s.destroy() })
      .to(s, { alpha: 0.9, duration: 0.12, ease: 'power2.out' })
      .to(s.scale, { x: taille, y: taille, duration: duree, ease: 'power2.out' }, 0)
      .to(s, { alpha: 0, duration: duree * 0.8, ease: 'power2.in' }, 0.15);
  }

  /** Pluie de jetons sur la table. */
  pluieDeJetons(n = 60, sol = this.hauteur - 260) {
    if (this.reduit) n = Math.min(n, 12);
    for (let i = 0; i < n; i++) {
      const s = new Sprite(this.texturesJetons[i % this.texturesJetons.length]);
      s.anchor.set(0.5);
      const echelle = 0.32 + Math.random() * 0.12;
      s.scale.set(echelle);
      s.position.set(20 + Math.random() * (this.largeur - 40), -30 - Math.random() * 260);
      this.pluie.addChild(s);
      this.tombants.push({
        s, echelle, vx: (Math.random() - 0.5) * 1.6, vy: Math.random() * 2, vr: (Math.random() - 0.5) * 0.25,
        sol: sol + (Math.random() - 0.5) * 120, rebonds: 0, vie: 150 + Math.random() * 60,
      });
    }
  }

  agiter(f = 1) { this.agitation = Math.max(this.agitation, f); }

  detruire() {
    gsap.ticker.remove(this.boucle);
    this.app?.destroy(true, { children: true, texture: true });
    this.app = null;
  }
}
