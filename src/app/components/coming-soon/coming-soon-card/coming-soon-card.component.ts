import { Component, Input, OnInit } from '@angular/core';
import { ComingSoonApp } from '../../../models/coming-soon.models';

@Component({
  selector: 'app-coming-soon-card',
  templateUrl: './coming-soon-card.component.html',
  styleUrls: ['./coming-soon-card.component.scss'],
})
export class ComingSoonCardComponent implements OnInit {
  @Input() public app!: ComingSoonApp;

  /** Inline CSS custom properties for app-specific theming. */
  public cardStyle: { [key: string]: string } = {};

  public ngOnInit(): void {
    this.cardStyle = {
      '--app-color': this.app.color,
      '--app-rgb': this.app.colorRgb,
    };
  }

  public onNotifyClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Future: wire to email capture / waitlist backend
    console.log(`[ComingSoon] Notify Me clicked for: ${this.app.name}`);
  }
}
