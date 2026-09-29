import { newSpecPage } from '@stencil/core/testing';
import { RtkSpeakerSelector } from './rtk-speaker-selector';

function createMeeting() {
  const listeners = new Map<string, Set<Function>>();
  const self = {
    addListener: jest.fn((event: string, fn: Function) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
    }),
    removeListener: jest.fn((event: string, fn: Function) => {
      listeners.get(event)?.delete(fn);
    }),
    getSpeakerDevices: jest.fn(async () => []),
    getCurrentDevices: jest.fn(() => ({ speaker: undefined })),
  };
  return { meeting: { self } as any, listeners };
}

describe('<rtk-speaker-selector>', () => {
  it('removes all of its meeting.self listeners when it is disconnected', async () => {
    const { meeting, listeners } = createMeeting();
    const page = await newSpecPage({
      components: [RtkSpeakerSelector],
      html: `<rtk-speaker-selector></rtk-speaker-selector>`,
    });
    page.root.meeting = meeting;
    await page.waitForChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect(listeners.get('mediaPermissionUpdate')?.size).toBe(1);

    page.root.remove();

    for (const event of ['deviceListUpdate', 'deviceUpdate', 'mediaPermissionUpdate']) {
      expect(listeners.get(event)?.size).toBe(0);
    }
  });
});
