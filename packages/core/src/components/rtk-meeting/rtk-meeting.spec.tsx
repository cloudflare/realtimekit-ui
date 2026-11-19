import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { RtkMeeting } from './rtk-meeting';

function createMeeting() {
  return {
    self: Object.assign(new EventEmitter(), {
      id: 'self-id',
      peerId: 'peer-id',
      roomJoined: true,
      config: null,
      permissions: { transcriptionEnabled: false },
    }),
    meta: Object.assign(new EventEmitter(), { viewType: 'GROUP_CALL' }),
    connectedMeetings: new EventEmitter(),
    join: jest.fn(() => Promise.resolve()),
    leave: jest.fn(),
    __internals__: { setUiKitMetadata: jest.fn() },
  };
}

describe('<rtk-meeting>', () => {
  it('reports the UI Kit metadata to the core SDK when it receives a meeting', async () => {
    const meeting = createMeeting();

    const page = await newSpecPage({
      components: [RtkMeeting],
      template: () => h('rtk-meeting', { meeting }),
    });

    expect(meeting.__internals__.setUiKitMetadata).toHaveBeenCalledWith({
      sdkName: 'html',
      sdkVersion: 'UI_KIT_VERSION_PLACEHOLDER',
    });

    // Disconnects the resize observer and the meeting listeners
    page.root?.remove();
  });
});
