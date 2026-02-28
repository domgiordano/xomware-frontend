import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-caution-tape',
  templateUrl: './caution-tape.component.html',
  styleUrls: ['./caution-tape.component.scss'],
})
export class CautionTapeComponent {
  /** Text content repeated in the scrolling marquee. */
  @Input() public text: string =
    '🚧 UNDER CONSTRUCTION · 🔧 COMING SOON · ⚡ XOMWARE LABS · 🤖 AGENTS BUILDING · ';

  /** Duration of one full scroll cycle in seconds. */
  @Input() public speed: number = 60;

  /**
   * Repeat the text enough times to guarantee seamless looping.
   * We render two copies side-by-side so the CSS translateX(-50%)
   * trick works on any viewport width.
   */
  public get repeatedText(): string {
    return Array(6).fill(this.text).join('');
  }
}
