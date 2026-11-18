import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { RtkUiProvider } from './rtk-ui-provider';

function createMeeting(id = 'self-id') {
  return {
    self: Object.assign(new EventEmitter(), {
      id,
      peerId: `peer-${id}`,
      roomJoined: true,
      permissions: { transcriptionEnabled: false },
    }),
    meta: Object.assign(new EventEmitter(), { viewType: 'GROUP_CALL' }),
    connectedMeetings: new EventEmitter(),
    join: jest.fn(() => Promise.resolve()),
    leave: jest.fn(),
    __internals__: { setUiKitMetadata: jest.fn() },
  };
}

describe('<rtk-ui-provider>', () => {
  it('reports the UI Kit metadata to the core SDK when it receives a meeting', async () => {
    const meeting = createMeeting();

    await newSpecPage({
      components: [RtkUiProvider],
      template: () => h('rtk-ui-provider', { meeting }),
    });

    expect(meeting.__internals__.setUiKitMetadata).toHaveBeenCalledWith({
      sdkName: 'html',
      sdkVersion: 'UI_KIT_VERSION_PLACEHOLDER',
    });
  });

  it('reports again when the meeting changes', async () => {
    const meeting = createMeeting('first');
    const nextMeeting = createMeeting('second');

    const page = await newSpecPage({
      components: [RtkUiProvider],
      template: () => h('rtk-ui-provider', { meeting }),
    });

    (page.root as HTMLRtkUiProviderElement).meeting = nextMeeting as any;
    await page.waitForChanges();

    expect(nextMeeting.__internals__.setUiKitMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ sdkName: 'html' })
    );
  });
});
