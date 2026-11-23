import { readFileSync } from 'fs';
import { join } from 'path';

const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/i)?.[1];
if (!script) throw new Error('Demo app script not found');

const createDemoApp = new Function(`${script}; return app;`)() as () => any;

function createMeeting() {
  return {
    self: { addListener: jest.fn(), removeListener: jest.fn() },
  };
}

async function attachDemo(autoEnableNoiseCancellation: boolean) {
  const app = createDemoApp();
  const root = { 'rtk-camera-toggle': ['rtk-icon'] };
  const meetingElement = { config: { root }, iconPack: { wand: '<svg />' } };
  const meeting = createMeeting();
  app.$refs = { meeting: meetingElement };
  app.data.autoEnableNoiseCancellation = autoEnableNoiseCancellation;
  app.syncNoiseCancellation = jest.fn();
  await app.attachMeetingObject(meeting, null);
  return { app, meeting, meetingElement };
}

describe('index.html demo addon menus', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

  beforeEach(() => {
    globalThis.requestAnimationFrame = (callback) => {
      callback(0);
      return 0;
    };
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    delete (window as any).meeting;
  });

  it('does not add or initialize noise cancellation when the setup option is unchecked', async () => {
    const { app, meeting, meetingElement } = await attachDemo(false);

    expect(meetingElement.config.root['rtk-mic-toggle']).toBeUndefined();
    expect(meetingElement.config.root['rtk-camera-toggle']).toEqual(['rtk-icon']);
    expect(meeting.self.addListener).not.toHaveBeenCalledWith('roomLeft', expect.any(Function));
    expect(app.syncNoiseCancellation).not.toHaveBeenCalled();
  });

  it('adds a noise option only when selected and keeps its enable/disable action', async () => {
    const { app, meeting, meetingElement } = await attachDemo(true);
    const option = meetingElement.config.root['rtk-mic-toggle'].add[0];

    expect(option[0]).toBe('rtk-menu-item');
    expect(option[1].slot).toBe('additional-menu-items');
    expect(option[3]).toBe('Disable noise cancellation');
    expect(meeting.self.addListener).toHaveBeenCalledWith('roomLeft', expect.any(Function));
    expect(app.syncNoiseCancellation).toHaveBeenCalledTimes(1);

    option[1].onClick();

    expect(meetingElement.config.root['rtk-mic-toggle'].add[0][3]).toBe(
      'Enable noise cancellation'
    );
    expect(app.syncNoiseCancellation).toHaveBeenCalledTimes(2);
  });
});
