import { E2EPage, newE2EPage } from '@stencil/core/testing';

const managerSelector = '#fixture >>> rtk-breakout-rooms-manager';
const roomSelector = `${managerSelector} >>> rtk-breakout-room-manager`;

async function createPage(title = 'Team Standup') {
  const page = await newE2EPage();
  await page.setViewport({ width: 1200, height: 900 });
  await page.setContent('<div id="fixture"></div>');
  await page.evaluate((parentTitle) => {
    const participant = (id: string) => ({
      id,
      customParticipantId: id,
      displayName: id,
      displayPictureUrl: '',
    });
    const state = {
      parentMeeting: {
        id: 'parent',
        title: parentTitle,
        participants: [participant('Alex')],
      },
      meetings: [
        { id: 'room-1', title: 'Planning', participants: [participant('Sam')] },
        { id: 'room-2', title: 'Design', participants: [] },
      ],
    };
    const listeners = new Map<string, (payload: typeof state) => void>();
    const connectedMeetings = {
      ...state,
      isActive: true,
      on(name: string, listener: (payload: typeof state) => void) {
        listeners.set(name, listener);
      },
      off(name: string) {
        listeners.delete(name);
      },
      getConnectedMeetings() {
        listeners.get('stateUpdate')?.(state);
        return Promise.resolve();
      },
    };
    const meeting = {
      meta: { meetingId: 'parent' },
      self: {
        userId: 'host',
        customParticipantId: 'host',
        permissions: {
          connectedMeetings: {
            canAlterConnectedMeetings: true,
            canSwitchConnectedMeetings: true,
            canSwitchToParentMeeting: true,
          },
          on() {},
          off() {},
        },
      },
      participants: { joined: { toArray: () => [] } },
      connectedMeetings,
    };
    const fixture = document.querySelector('#fixture');
    if (!fixture) throw new Error('Missing dialog fixture');
    // Match the nested Shadow DOM and positioned modal that caused the tooltip offset.
    const shadow = fixture.attachShadow({ mode: 'open' });
    const dialog = document.createElement('dialog');
    dialog.style.cssText = 'width: 900px; padding: 24px; background: #101010; color: white;';
    const manager = document.createElement('rtk-breakout-rooms-manager');
    Object.assign(manager, { meeting, states: {} });
    dialog.append(manager);
    shadow.append(dialog);
    dialog.showModal();
  }, title);
  await page.waitForChanges();
  await page.waitForSelector(`${roomSelector} >>> .room-title`);
  return page;
}

async function expectTooltipNearTrigger(page: E2EPage, selector: string) {
  const owner = await page.$(selector.slice(0, selector.lastIndexOf(' >>> ')));
  if (!owner) throw new Error('Missing tooltip owner');
  // Room actions are hidden until their card is hovered.
  await owner.hover();
  const tooltip = await page.$(selector);
  if (!tooltip) throw new Error('Missing tooltip');
  await tooltip.hover();
  await page.waitForSelector(`${selector} >>> #tooltip`, { visible: true });
  await page.waitForChanges();
  const geometry = await tooltip.evaluate((element) => {
    const trigger = element.shadowRoot.querySelector('#trigger').getBoundingClientRect();
    const bubble = element.shadowRoot.querySelector('#tooltip').getBoundingClientRect();
    const arrow = element.shadowRoot.querySelector('#arrow').getBoundingClientRect();
    return {
      arrowOffset: Math.abs(arrow.x + arrow.width / 2 - (trigger.x + trigger.width / 2)),
      verticalGap: Math.min(
        Math.abs(bubble.bottom - trigger.top),
        Math.abs(bubble.top - trigger.bottom)
      ),
      left: bubble.left,
      right: bubble.right,
      viewportWidth: window.innerWidth,
    };
  });
  expect(geometry.arrowOffset).toBeLessThanOrEqual(2);
  expect(geometry.verticalGap).toBeLessThanOrEqual(12);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
}

describe('breakout room layout in a dialog', () => {
  it('keeps the edit tooltip anchored to the edit control', async () => {
    const page = await createPage();
    await expectTooltipNearTrigger(page, `${roomSelector} >>> .title-action`);
  });

  it('keeps the delete tooltip anchored to the delete control', async () => {
    const page = await createPage();
    const room = `${managerSelector} >>> rtk-breakout-room-manager:nth-of-type(2)`;
    await expectTooltipNearTrigger(page, `${room} >>> .danger`);
  });

  it('keeps the slotted shuffle tooltip anchored to the shuffle control', async () => {
    const page = await createPage();
    await expectTooltipNearTrigger(
      page,
      `${managerSelector} >>> rtk-tooltip[slot="shuffle-button"]`
    );
  });

  it('keeps the title, edit icon, main-room label and count on one line with a small edit gap', async () => {
    const page = await createPage();
    const title = await page.$(`${roomSelector} >>> .room-title`);
    await title.hover();
    const room = await page.$(roomSelector);
    const geometry = await room.evaluate((element) => {
      const root = element.shadowRoot;
      const title = root.querySelector('.room-title').getBoundingClientRect();
      const icon = root.querySelector('.title-action rtk-icon').getBoundingClientRect();
      const label = root.querySelector('.main-room-indicator').getBoundingClientRect();
      const count = root.querySelector('.participant-count').getBoundingClientRect();
      return {
        gap: icon.left - title.right,
        centers: [title, icon, label, count].map((rect) => rect.y + rect.height / 2),
        hasInput: root.querySelector('input') !== null,
      };
    });
    expect(geometry.hasInput).toBe(false);
    expect(geometry.gap).toBeGreaterThanOrEqual(0);
    expect(geometry.gap).toBeLessThanOrEqual(8);
    expect(Math.max(...geometry.centers) - Math.min(...geometry.centers)).toBeLessThanOrEqual(2);
  });

  it('truncates long titles without pushing the edit control away', async () => {
    const fullTitle = 'A very long breakout room title that cannot fit inside the room header';
    const page = await createPage(fullTitle);
    const title = await page.$(`${roomSelector} >>> .room-title`);
    expect(await title.evaluate((element) => element.getAttribute('title'))).toBe(fullTitle);
    const layout = await title.evaluate((element) => ({
      overflowed: element.scrollWidth > element.clientWidth,
      ellipsis: getComputedStyle(element).textOverflow,
    }));
    expect(layout).toEqual({ overflowed: true, ellipsis: 'ellipsis' });
    await title.hover();
    const action = await page.$(`${roomSelector} >>> .title-action`);
    const titleBox = await title.boundingBox();
    const actionBox = await action.boundingBox();
    expect(actionBox.x - titleBox.x - titleBox.width).toBeLessThanOrEqual(8);
  });

  it.each(['click', 'Enter', 'Space'])(
    'focuses and selects the editor via %s, then removes it after saving',
    async (activateWith) => {
      const page = await createPage();
      const title = await page.$(`${roomSelector} >>> .room-title`);
      if (activateWith === 'click') {
        await title.click();
      } else {
        await title.focus();
        await page.keyboard.press(activateWith === 'Enter' ? 'Enter' : 'Space');
      }
      await page.waitForChanges();
      const input = await page.$(`${roomSelector} >>> input`);
      expect(input).not.toBeNull();
      const editorState = await input.evaluate((element) => {
        if (!(element instanceof HTMLInputElement)) throw new Error('Missing title editor');
        return {
          focused: element.matches(':focus'),
          value: element.value,
          start: element.selectionStart,
          end: element.selectionEnd,
        };
      });
      expect(editorState).toEqual({
        focused: true,
        value: 'Team Standup',
        start: 0,
        end: 'Team Standup'.length,
      });
      await page.keyboard.type('Renamed Standup');
      await page.keyboard.press('Enter');
      await page.waitForChanges();
      expect(await page.$(`${roomSelector} >>> input`)).toBeNull();
      const savedTitle = await page.$(`${roomSelector} >>> .room-title`);
      expect(await savedTitle.evaluate((element) => element.textContent.trim())).toBe(
        'Renamed Standup'
      );
      expect(await savedTitle.evaluate((element) => element.matches(':focus'))).toBe(false);
      const count = await page.$(`${roomSelector} >>> .participant-count`);
      expect(await count.evaluate((element) => element.textContent.trim())).toBe('(1)');
    }
  );
});
