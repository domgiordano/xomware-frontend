import { Component } from '@angular/core';
import { ComingSoonApp, COMING_SOON_APPS } from '../../../models/coming-soon.models';

@Component({
  selector: 'app-coming-soon-section',
  templateUrl: './coming-soon-section.component.html',
  styleUrls: ['./coming-soon-section.component.scss'],
})
export class ComingSoonSectionComponent {
  public readonly apps: ComingSoonApp[] = COMING_SOON_APPS;

  /** Primary tape text (used for both strips). */
  public readonly tapeText: string =
    '🚧 UNDER CONSTRUCTION · 🔧 COMING SOON · ⚡ XOMWARE LABS · 🤖 AGENTS BUILDING · ';
}
