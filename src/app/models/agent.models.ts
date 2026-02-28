export type AgentAnimation =
  | 'pace' | 'hammer' | 'patrol' | 'orbit' | 'write' | 'nod';

export interface AgentBlob {
  name: string;
  displayName: string;
  role: string;
  color: string;
  scale: number;
  startX: number;
  startY: number;
  idleAnimation: AgentAnimation;
  signatureAnimation: AgentAnimation;
  currentTask?: string;
  lastAction?: string;
}
