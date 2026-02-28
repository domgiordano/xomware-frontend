import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-caution-tape',
  templateUrl: './caution-tape.component.html',
  styleUrls: ['./caution-tape.component.scss'],
})
export class CautionTapeComponent {
  @Input() text = '🚧 UNDER CONSTRUCTION · 🔧 COMING SOON · ⚡ XOMWARE LABS · 🤖 AGENTS BUILDING · ';
}
