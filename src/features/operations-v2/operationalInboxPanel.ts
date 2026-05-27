export type InboxPanelMode = 'inbox' | 'explore';

export function parseInboxPanel(value: string | null): InboxPanelMode {
  return value === 'explore' ? 'explore' : 'inbox';
}
