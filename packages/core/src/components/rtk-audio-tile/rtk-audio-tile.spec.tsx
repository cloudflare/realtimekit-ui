import { newSpecPage } from '@stencil/core/testing';
import { RtkAudioTile } from './rtk-audio-tile';

describe('<rtk-audio-tile>', () => {
  beforeEach(() => {
    (globalThis as any).MediaStream = class {
      addTrack() {}
    };
  });

  async function createTile() {
    const page = await newSpecPage({
      components: [RtkAudioTile],
      html: `<rtk-audio-tile></rtk-audio-tile>`,
    });
    page.root.participant = {
      id: 'p1',
      audioEnabled: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    } as any;
    await page.waitForChanges();
    const tile = page.rootInstance as any;
    // an analyser started by an earlier audioUpdate
    tile.hark = { on: jest.fn(), stop: jest.fn() };
    return tile;
  }

  it('stops the previous audio analyser when a new audio track arrives', async () => {
    const tile = await createTile();
    const previous = tile.hark;

    tile.onAudioUpdate({ audioEnabled: true, audioTrack: {} });

    expect(previous.stop).toHaveBeenCalledTimes(1);
    expect(tile.hark).not.toBe(previous);
  });

  it('stops the audio analyser when audio is turned off', async () => {
    const tile = await createTile();
    const previous = tile.hark;

    tile.onAudioUpdate({ audioEnabled: false, audioTrack: null });

    expect(previous.stop).toHaveBeenCalledTimes(1);
  });
});
