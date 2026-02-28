import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  OnChanges,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import { gsap } from 'gsap';
import { AgentBlob } from '../../../models/agent.models';

@Component({
  selector: 'app-agent-status-modal',
  templateUrl: './agent-status-modal.component.html',
  styleUrls: ['./agent-status-modal.component.scss'],
})
export class AgentStatusModalComponent implements OnChanges {
  @Input() agent: AgentBlob | null = null;
  @Output() close = new EventEmitter<void>();

  get isOpen(): boolean {
    return this.agent !== null;
  }

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agent'] && this.agent) {
      // Animate in
      requestAnimationFrame(() => {
        const panel = this.el.nativeElement.querySelector('.modal-panel');
        if (panel) {
          gsap.fromTo(panel,
            { opacity: 0, y: 20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }
          );
        }
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }

  onBackdropClick(): void {
    this.closeModal();
  }

  private closeModal(): void {
    if (!this.isOpen) return;
    const panel = this.el.nativeElement.querySelector('.modal-panel');
    if (panel) {
      gsap.to(panel, {
        opacity: 0,
        y: 12,
        scale: 0.95,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => this.close.emit(),
      });
    } else {
      this.close.emit();
    }
  }
}
