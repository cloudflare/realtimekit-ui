import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Notification } from '../../types/props';
import { RtkNotification } from './rtk-notification';

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function createNotification(notification: Notification, paused = false) {
  const page = await newSpecPage({
    components: [RtkNotification],
    template: () => h('rtk-notification', { notification, paused }),
  });
  const onDismiss = jest.fn();
  page.root.addEventListener('rtkNotificationDismiss', onDismiss);
  return { page, onDismiss };
}

describe('<rtk-notification> duration', () => {
  it('closes on the timer of the newest notification when the notification is replaced', async () => {
    const { page, onDismiss } = await createNotification({
      id: 'activeTab',
      message: 'Plugin switched to Whiteboard',
      duration: 300,
    });

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

  it('does not close while it is paused, and closes after the pause ends', async () => {
    const { page, onDismiss } = await createNotification({
      id: 'new-peer-joined',
      message: 'Ada just joined',
      duration: 150,
    });

    page.root.paused = true;
    await page.waitForChanges();
    await wait(250);
    expect(onDismiss).not.toHaveBeenCalled();

    page.root.paused = false;
    await page.waitForChanges();
    await wait(250);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays open when the notification has no duration', async () => {
    const { onDismiss } = await createNotification({ id: 'socket', message: 'Connection lost.' });

    await wait(150);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('<rtk-notification> content', () => {
  it('shows the message and asks to be dismissed from the dismiss button', async () => {
    const { page, onDismiss } = await createNotification({
      id: 'new-peer-joined',
      message: 'Ada just joined',
    });

    expect(page.root.shadowRoot.querySelector('.message').textContent).toBe('Ada just joined');

    (page.root.shadowRoot.querySelector('button.dismiss') as HTMLButtonElement).click();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss.mock.calls[0][0].detail).toBe('new-peer-joined');
  });

  it('shows the icon of the notification and no image', async () => {
    const { page } = await createNotification({
      id: 'recording-started',
      message: 'Recording started',
      icon: '<svg></svg>',
      image: 'https://example.com/ada.png',
    });

    expect(page.root.shadowRoot.querySelector('rtk-icon.icon')).not.toBeNull();
    expect(page.root.shadowRoot.querySelector('img')).toBeNull();
  });

  it('marks the image as loaded after it loads', async () => {
    const { page } = await createNotification({
      id: 'new-peer-joined',
      message: 'Ada just joined',
      image: 'https://example.com/ada.png',
    });
    const image = page.root.shadowRoot.querySelector('img');
    expect(image.classList.contains('loaded')).toBe(false);

    image.dispatchEvent(new Event('load'));
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('img').classList.contains('loaded')).toBe(true);
  });

  it('removes the image when it fails to load', async () => {
    const { page } = await createNotification({
      id: 'new-peer-joined',
      message: 'Ada just joined',
      image: 'https://example.com/missing.png',
    });

    page.root.shadowRoot.querySelector('img').dispatchEvent(new Event('error'));
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('img')).toBeNull();
  });

  it('shows the button of the notification and runs its action on click', async () => {
    const onClick = jest.fn();
    const { page } = await createNotification({
      id: 'waiting-peer-joined-waitlist',
      message: 'Ada is requesting to join the meeting',
      button: { text: 'Accept', variant: 'primary', onClick },
    });
    const button = page.root.shadowRoot.querySelector('rtk-button');

    expect(button.textContent).toBe('Accept');

    button.dispatchEvent(new Event('click'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
