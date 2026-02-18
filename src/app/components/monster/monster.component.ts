import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-monster',
  templateUrl: './monster.component.html',
  styleUrls: ['./monster.component.scss'],
})
export class MonsterComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() state = 'idle';
  @ViewChild('blobSvg', { static: true }) svgRef!: ElementRef<SVGElement>;

  private initialized = false;
  private blinkTimer: any;

  private readonly NUM_BLOBS = 6;
  private readonly SCALES = [1.0, 0.8, 1.12, 0.68, 0.9, 0.75];
  private readonly START_POS = [
    [55, 80], [130, 100], [200, 70], [260, 95], [160, 115], [85, 60],
  ];

  private readonly DEFAULT_COLOR = '#00b4d8';
  private readonly COLOR_MAP: Record<string, string> = {
    idle: '#00b4d8',
    wave: '#00b4d8',
    sleep: '#0e6e85',
    headphones: '#9c0abf',
    dj: '#ff6b35',
    football: '#00ffab',
  };

  // Target areas for each hover state (xMin, xMax, yMin, yMax)
  // Left = xomify, Center = xomcloud, Right = xomper
  private readonly TARGET_AREAS: Record<string, [number, number, number, number]> = {
    headphones: [25, 105, 45, 125],
    dj: [105, 215, 45, 125],
    football: [215, 295, 45, 125],
  };

  // Mouth paths
  private readonly MOUTH_NEUTRAL = 'M-3,5 Q0,7 3,5';
  private readonly MOUTH_SMILE = 'M-5,4 Q0,11 5,4';
  private readonly MOUTH_SLEEP = 'M-2,6 L2,6';

  ngAfterViewInit(): void {
    this.initialized = true;
    this.initBlobs();
    this.applyState(this.state);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['state'] && this.initialized) {
      this.applyState(this.state);
    }
  }

  ngOnDestroy(): void {
    this.killAll();
  }

  private get svg(): SVGElement {
    return this.svgRef.nativeElement;
  }

  private qa(selector: string): Element[] {
    return Array.from(this.svg.querySelectorAll(selector));
  }

  private blob(i: number): Element | null {
    return this.svg.querySelector(`.blob-${i}`);
  }

  private initBlobs(): void {
    for (let i = 0; i < this.NUM_BLOBS; i++) {
      const el = this.blob(i);
      if (!el) continue;
      gsap.set(el, {
        x: this.START_POS[i][0],
        y: this.START_POS[i][1],
        scale: this.SCALES[i],
      });
    }
  }

  private killAll(): void {
    clearTimeout(this.blinkTimer);

    // Kill all GSAP tweens on every element inside the SVG
    const allEls = this.qa('*');
    gsap.killTweensOf(allEls);

    // Also kill on blob groups directly
    for (let i = 0; i < this.NUM_BLOBS; i++) {
      const el = this.blob(i);
      if (el) gsap.killTweensOf(el);
    }
  }

  private applyState(state: string): void {
    this.killAll();

    // Reset eyes open
    gsap.set(this.qa('.b-eyes'), { scaleY: 1, transformOrigin: '0px -3px' });

    // Hide sleep Z's
    gsap.set(this.qa('.sleep-group'), { opacity: 0 });

    const color = this.COLOR_MAP[state] || this.DEFAULT_COLOR;

    switch (state) {
      case 'idle':
      case 'wave':
        this.buildIdle(color);
        break;
      case 'sleep':
        this.buildSleep();
        break;
      case 'headphones':
      case 'dj':
      case 'football':
        this.buildExcited(state, color);
        break;
      default:
        this.buildIdle(this.DEFAULT_COLOR);
    }

    // Start blink loop unless sleeping
    if (state !== 'sleep') {
      this.startBlink();
    }
  }

  // ==============================
  // IDLE — blobs wander randomly
  // ==============================
  private buildIdle(color: string): void {
    // Transition color
    gsap.to(this.qa('.b-body'), {
      attr: { fill: color },
      duration: 0.6,
      ease: 'power2.out',
    });

    // Neutral mouth
    this.setMouths(this.MOUTH_NEUTRAL);

    // Start each blob wandering
    for (let i = 0; i < this.NUM_BLOBS; i++) {
      this.wanderBlob(i);
    }

    // Subtle body squish breathing
    for (let i = 0; i < this.NUM_BLOBS; i++) {
      const body = this.blob(i)?.querySelector('.b-body');
      if (!body) continue;
      gsap.to(body, {
        attr: { ry: 17 },
        duration: 1.5 + Math.random() * 0.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: Math.random(),
      });
    }
  }

  private wanderBlob(index: number): void {
    const el = this.blob(index);
    if (!el) return;

    const x = 30 + Math.random() * 260;
    const y = 35 + Math.random() * 110;
    const duration = 2.5 + Math.random() * 3;

    gsap.to(el, {
      x,
      y,
      duration,
      ease: 'sine.inOut',
      onComplete: () => this.wanderBlob(index),
    });
  }

  // ==============================
  // EXCITED — blobs rush toward hovered card, change color, smile
  // ==============================
  private buildExcited(state: string, color: string): void {
    const area = this.TARGET_AREAS[state];
    if (!area) return;

    // Change color
    gsap.to(this.qa('.b-body'), {
      attr: { fill: color },
      duration: 0.35,
      ease: 'power2.out',
    });

    // Big smile
    this.setMouths(this.MOUTH_SMILE);

    // Rush each blob to the target area with staggered arrival
    for (let i = 0; i < this.NUM_BLOBS; i++) {
      const el = this.blob(i);
      if (!el) continue;

      const targetX = area[0] + Math.random() * (area[1] - area[0]);
      const targetY = area[2] + Math.random() * (area[3] - area[2]);

      gsap.to(el, {
        x: targetX,
        y: targetY,
        duration: 0.4 + i * 0.06,
        ease: 'back.out(1.7)',
        onComplete: () => this.bounceAtTarget(i, area),
      });
    }
  }

  private bounceAtTarget(index: number, area: [number, number, number, number]): void {
    const el = this.blob(index);
    if (!el) return;

    // Energetic vertical bounce
    gsap.to(el, {
      y: `-=${5 + Math.random() * 5}`,
      duration: 0.2 + Math.random() * 0.15,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    // Small lateral drift so they jostle
    gsap.to(el, {
      x: `+=${(Math.random() - 0.5) * 24}`,
      duration: 0.8 + Math.random() * 0.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    // Body squash/stretch with bounce
    const body = el.querySelector('.b-body');
    if (body) {
      gsap.to(body, {
        attr: { rx: 20, ry: 14 },
        duration: 0.2 + Math.random() * 0.1,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }
  }

  // ==============================
  // SLEEP — blobs settle, eyes close, Z's float
  // ==============================
  private buildSleep(): void {
    const color = this.COLOR_MAP['sleep'];

    // Dim color
    gsap.to(this.qa('.b-body'), {
      attr: { fill: color },
      duration: 1.2,
      ease: 'power2.out',
    });

    // Sleep mouth
    this.setMouths(this.MOUTH_SLEEP);

    // Close eyes
    gsap.to(this.qa('.b-eyes'), {
      scaleY: 0.08,
      duration: 0.6,
      ease: 'power2.inOut',
      transformOrigin: '0px -3px',
    });

    // Move blobs to resting positions (loosely spread, centered)
    const restPos = [
      [70, 95], [130, 108], [195, 88], [255, 102], [160, 75], [100, 112],
    ];

    for (let i = 0; i < this.NUM_BLOBS; i++) {
      const el = this.blob(i);
      if (!el) continue;

      gsap.to(el, {
        x: restPos[i][0],
        y: restPos[i][1],
        duration: 1.5,
        ease: 'power2.out',
      });

      // Gentle breathing once settled
      gsap.to(el, {
        y: `+=${1.5}`,
        duration: 2.2 + Math.random() * 0.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1.5 + Math.random() * 0.5,
      });

      // Body subtle breathing
      const body = el.querySelector('.b-body');
      if (body) {
        gsap.to(body, {
          attr: { ry: 17 },
          duration: 2.5 + Math.random() * 0.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 1.5,
        });
      }
    }

    // Show sleep Z's above blob-2 (the biggest one at ~195, 88)
    gsap.to(this.qa('.sleep-group'), { opacity: 1, duration: 0.8, delay: 1.2 });

    const zSels = ['.z1', '.z2', '.z3'];
    zSels.forEach((sel, i) => {
      const baseX = 210 + i * 12;
      const baseY = 70 - i * 14;
      gsap.set(this.qa(sel), { x: baseX, y: baseY });
      gsap.fromTo(
        this.qa(sel),
        { opacity: 0, y: baseY },
        {
          keyframes: [
            { opacity: 0.7, y: baseY - 6, duration: 0.6, ease: 'sine.in' },
            { opacity: 0, y: baseY - 22, duration: 1.6, ease: 'sine.out' },
          ],
          repeat: -1,
          delay: i * 0.6,
        }
      );
    });
  }

  // ==============================
  // Utilities
  // ==============================
  private setMouths(d: string): void {
    this.qa('.b-mouth').forEach((m) => {
      gsap.set(m, { attr: { d } });
    });
  }

  private startBlink(): void {
    const doBlink = () => {
      const eyes = this.qa('.b-eyes');
      if (!eyes.length) return;

      gsap.to(eyes, {
        scaleY: 0.08,
        duration: 0.06,
        ease: 'power2.in',
        transformOrigin: '0px -3px',
        onComplete: () => {
          gsap.to(eyes, {
            scaleY: 1,
            duration: 0.1,
            ease: 'power2.out',
            delay: 0.04,
            transformOrigin: '0px -3px',
          });
        },
      });
    };

    const schedule = () => {
      this.blinkTimer = setTimeout(() => {
        doBlink();
        schedule();
      }, 2500 + Math.random() * 3500);
    };
    schedule();
  }
}
