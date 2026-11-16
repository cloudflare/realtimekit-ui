import { newSpecPage } from '@stencil/core/testing';
import { RtkMeetingTitle } from './rtk-meeting-title';

const emitter = () => ({ addListener: jest.fn(), removeListener: jest.fn() });

function createMeeting(
  permissions: object,
  parentMeetingId?: string,
  isActive = !!parentMeetingId
) {
  return {
    meta: { meetingTitle: 'Standup', setMeetingTitle: jest.fn(), ...emitter() },
    self: { permissions: { ...permissions, ...emitter() } },
    connectedMeetings: { parentMeeting: { id: parentMeetingId }, isActive, ...emitter() },
  } as any;
}

async function render(meeting: any) {
  const page = await newSpecPage({
    components: [RtkMeetingTitle],
    html: `<rtk-meeting-title></rtk-meeting-title>`,
  });
  page.root.meeting = meeting;
  await page.waitForChanges();
  return page;
}

const isEditable = async (meeting: any) =>
  (await render(meeting)).root.shadowRoot.querySelector('.title[role="button"]') !== null;

describe('<rtk-meeting-title>', () => {
  it('makes the title editable only with canEditMeetingTitle in a regular meeting', async () => {
    expect(await isEditable(createMeeting({ canEditMeetingTitle: true }))).toBe(true);
    expect(await isEditable(createMeeting({ canEditMeetingTitle: false }))).toBe(false);
  });

  it('uses canAlterConnectedMeetings instead inside a connected meeting', async () => {
    const connected = (canAlterConnectedMeetings: boolean) => ({
      canEditMeetingTitle: !canAlterConnectedMeetings,
      connectedMeetings: { canAlterConnectedMeetings },
    });
    expect(await isEditable(createMeeting(connected(true), 'parent'))).toBe(true);
    expect(await isEditable(createMeeting(connected(false), 'parent'))).toBe(false);
    // No breakout rooms yet: canEditMeetingTitle decides, as in a regular meeting.
    expect(await isEditable(createMeeting(connected(false), 'parent', false))).toBe(true);
    expect(await isEditable(createMeeting(connected(true), 'parent', false))).toBe(false);
  });

  it('saves the typed title once and closes the editor', async () => {
    const meeting = createMeeting({ canEditMeetingTitle: true });
    const page = await render(meeting);
    const shadow = page.root.shadowRoot;
    // Stencil's mock DOM has no input.select(), which startEditing calls.
    Object.getPrototypeOf(page.doc.createElement('input')).select = jest.fn();
    shadow.querySelector<HTMLElement>('.title').click();
    await page.waitForChanges();
    shadow.querySelector('input').value = 'Retro';

    const instance = page.rootInstance as any;
    await Promise.all([instance.save(), instance.save()]);
    await page.waitForChanges();

    expect(meeting.meta.setMeetingTitle).toHaveBeenCalledTimes(1);
    expect(meeting.meta.setMeetingTitle).toHaveBeenCalledWith('Retro');
    expect(shadow.querySelector('input')).toBeNull();
  });
});
