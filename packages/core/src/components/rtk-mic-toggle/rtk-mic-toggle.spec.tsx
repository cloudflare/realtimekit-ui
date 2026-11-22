import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { RtkControlbarButton } from '../rtk-controlbar-button/rtk-controlbar-button';
import { RtkMenu } from '../rtk-menu/rtk-menu';
import { RtkMicToggle } from './rtk-mic-toggle';

const device = (kind: MediaDeviceKind, deviceId: string, label: string) =>
  ({ kind, deviceId, label, groupId: '' } as MediaDeviceInfo);

async function createToggle({
  inputs = [],
  outputs = [],
  selectedAudio,
  selectedSpeaker,
  hideDeviceSelectionMenu = false,
  firefox = false,
}: {
  inputs?: MediaDeviceInfo[];
  outputs?: MediaDeviceInfo[];
  selectedAudio?: MediaDeviceInfo;
  selectedSpeaker?: MediaDeviceInfo;
  hideDeviceSelectionMenu?: boolean;
  firefox?: boolean;
} = {}) {
  let currentDevices = { audio: selectedAudio, speaker: selectedSpeaker };
  const self = Object.assign(new EventEmitter(), {
    audioEnabled: true,
    mediaPermissions: { audio: 'ACCEPTED' },
    permissions: Object.assign(new EventEmitter(), { canProduceAudio: 'ALLOWED' }),
    getAudioDevices: jest.fn(async () => inputs),
    getSpeakerDevices: jest.fn(async () => outputs),
    getCurrentDevices: jest.fn(() => currentDevices),
    setDevice: jest.fn(async (next: MediaDeviceInfo) => {
      currentDevices = {
        ...currentDevices,
        [next.kind === 'audioinput' ? 'audio' : 'speaker']: next,
      };
    }),
    enableAudio: jest.fn(),
    disableAudio: jest.fn(),
  });
  const meeting = {
    self,
    stage: Object.assign(new EventEmitter(), { status: 'ON_STAGE' }),
    __internals__: {
      logger: { info: jest.fn(), warn: jest.fn() },
      browserSpecs: { isFirefox: jest.fn(() => firefox) },
    },
  };
  const page = await newSpecPage({
    components: [RtkMicToggle, RtkControlbarButton, RtkMenu],
    template: () => h('rtk-mic-toggle', { meeting, hideDeviceSelectionMenu }),
  });
  await page.waitForChanges();
  return { page, self };
}

describe('<rtk-mic-toggle> device menu', () => {
  it('lists valid microphones above speakers and checks the selected devices', async () => {
    const mic = device('audioinput', 'mic', 'Desk microphone');
    const speaker = device('audiooutput', 'speaker', 'Headphones');
    const { page } = await createToggle({
      inputs: [mic, device('audioinput', '', 'Unavailable')],
      outputs: [speaker, device('audiooutput', '', 'Unavailable')],
      selectedAudio: mic,
      selectedSpeaker: speaker,
    });
    const root = page.root.shadowRoot;
    const items = Array.from(root.querySelectorAll('rtk-menu-item[role=menuitemradio]'));

    expect(items.map((item) => item.textContent.trim())).toEqual(['Desk microphone', 'Headphones']);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'true']);
    expect(items.every((item) => item.querySelector('rtk-icon[slot=end]') != null)).toBe(true);
    expect(root.querySelectorAll('.menu-divider')).toHaveLength(1);
    page.root.remove();
  });

  it('shows localized empty states and updates devices from the SDK event', async () => {
    const { page, self } = await createToggle();
    const root = page.root.shadowRoot;
    expect(Array.from(root.querySelectorAll('.empty-devices')).map((el) => el.textContent)).toEqual(
      ['No microphone found', 'No speaker found']
    );

    self.emit('deviceListUpdate', {
      devices: [
        device('audioinput', 'mic', 'USB microphone'),
        device('audiooutput', 'speaker', 'USB speakers'),
        device('videoinput', 'video', 'Camera'),
      ],
    });
    await page.waitForChanges();

    expect(root.querySelectorAll('.empty-devices')).toHaveLength(0);
    expect(
      Array.from(root.querySelectorAll('rtk-menu-item[role=menuitemradio]')).map((el) =>
        el.textContent.trim()
      )
    ).toEqual(['USB microphone', 'USB speakers']);
    expect(self.getAudioDevices).toHaveBeenCalledTimes(1);
    expect(self.getSpeakerDevices).toHaveBeenCalledTimes(1);
    page.root.remove();
  });

  it('selects an input or output without toggling the microphone', async () => {
    const first = device('audioinput', 'first', 'Built-in microphone');
    const second = device('audioinput', 'second', 'External microphone');
    const speaker = device('audiooutput', 'speaker', 'Headphones');
    const { page, self } = await createToggle({
      inputs: [first, second],
      outputs: [speaker],
      selectedAudio: first,
    });
    const items = page.root.shadowRoot.querySelectorAll<HTMLElement>(
      'rtk-menu-item[role=menuitemradio]'
    );

    items[1].click();
    await self.setDevice.mock.results[0].value;
    await page.waitForChanges();

    expect(self.setDevice).toHaveBeenCalledWith(second);
    expect(self.disableAudio).not.toHaveBeenCalled();
    expect(
      page.root.shadowRoot.querySelector('rtk-menu-item[aria-checked=true]').textContent
    ).toContain('External microphone');
    items[2].click();
    await self.setDevice.mock.results[1].value;
    await page.waitForChanges();
    expect(self.setDevice).toHaveBeenCalledWith(speaker);
    expect(page.root.shadowRoot.querySelectorAll('rtk-menu-item[aria-checked=true]')).toHaveLength(
      2
    );
    page.root.remove();
  });

  it('shows speakers but prevents selection in Firefox', async () => {
    const speaker = device('audiooutput', 'speaker', 'Headphones');
    const { page, self } = await createToggle({ outputs: [speaker], firefox: true });
    const row = page.root.shadowRoot.querySelector<HTMLElement>(
      'rtk-menu-item[role=menuitemradio]'
    );

    expect(row.getAttribute('aria-disabled')).toBe('true');
    expect(row.tabIndex).toBe(-1);
    row.click();
    expect(self.setDevice).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('hides the menu but retains the standalone labeled microphone button', async () => {
    const { page, self } = await createToggle({ hideDeviceSelectionMenu: true });
    const root = page.root.shadowRoot;
    const button = root.querySelector<HTMLRtkControlbarButtonElement>('rtk-controlbar-button');

    expect(root.querySelector('rtk-menu')).toBeNull();
    expect(button.label).toBeTruthy();
    button.click();
    expect(self.disableAudio).toHaveBeenCalledTimes(1);
    page.root.remove();
  });

  it('adds the extra-group divider only when additional menu entries are assigned', async () => {
    const { page } = await createToggle();
    const root = page.root.shadowRoot;
    const extras = root.querySelector('.additional-menu-items');
    const slot = extras.querySelector('slot[name=additional-menu-items]') as HTMLSlotElement;
    expect(extras.querySelector('.menu-divider')).toBeNull();

    const noise = page.doc.createElement('rtk-menu-item');
    noise.slot = 'additional-menu-items';
    page.root.append(noise);
    Object.defineProperty(slot, 'assignedElements', { configurable: true, value: () => [noise] });
    slot.dispatchEvent(new Event('slotchange'));
    await page.waitForChanges();

    expect(extras.querySelector('.menu-divider')).not.toBeNull();
    page.root.remove();
  });
});
