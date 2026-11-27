import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { RtkNotification } from './rtk-notification';

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('<rtk-notification> duration', () => {
  it('closes on the timer of the newest notification when the notification is replaced', async () => {
    const page = await newSpecPage({
      components: [RtkNotification],
      template: () =>
        h('rtk-notification', {
          notification: {
            id: 'activeTab',
            message: 'Plugin switched to Whiteboard',
            duration: 300,
          },
        }),
    });
    const onDismiss = jest.fn();
    page.root.addEventListener('rtkNotificationDismiss', onDismiss);

    await wait(150);
    page.root.notification = {
      id: 'activeTab',
      message: 'Plugin switched to Notes',
      duration: 300,
    };
    await page.waitForChanges();

    // the timer of the first notification would end here
    await wait(200);
    expect(onDismiss).not.toHaveBeenCalled();

    await wait(200);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss.mock.calls[0][0].detail).toBe('activeTab');
  });
});
