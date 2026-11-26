const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const postcss = require('postcss');
const puppeteer = require('puppeteer');

const corePath = path.join(__dirname, '../packages/core');

async function processComponentCss(componentName) {
  const file = path.join(corePath, `src/components/${componentName}/${componentName}.css`);
  const plugins = [
    require('tailwindcss/nesting'),
    require('tailwindcss')({ config: path.join(corePath, 'tailwind.config.js') }),
    require('autoprefixer'),
  ];
  const { css } = await postcss(plugins).process(fs.readFileSync(file, 'utf8'), { from: file });
  return css.replace(/^@import[^;]*;/, '');
}

test('screen-share progress flows in half a second and +N matches the avatar colors', async (context) => {
  const [viewCss, avatarCss] = await Promise.all([
    processComponentCss('rtk-screenshare-view'),
    processComponentCss('rtk-avatar'),
  ]);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  context.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent('<div id="host"></div>');
  await page.evaluate(
    ({ viewCss, avatarCss }) => {
      CSS.registerProperty({
        name: '--rtk-screenshare-view-progress',
        syntax: '<percentage>',
        inherits: true,
        initialValue: '0%',
      });
      const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = viewCss;
      shadow.append(style);

      const border = document.createElement('div');
      border.className = 'validation-border none-active';
      border.style.setProperty('--validation-progress', '100%');
      shadow.append(border);

      const avatars = document.createElement('div');
      avatars.className = 'pending-avatars';
      const avatar = document.createElement('rtk-avatar');
      const avatarShadow = avatar.attachShadow({ mode: 'open' });
      avatarShadow.innerHTML = `<style>${avatarCss}</style><div class="initials">A</div>`;
      avatars.append(avatar);
      const moreAvatar = document.createElement('button');
      moreAvatar.className = 'more-avatar';
      moreAvatar.textContent = '+2';
      avatars.append(moreAvatar);
      shadow.append(avatars);
      window.screenShareBorder = border;
      window.pendingAvatar = avatar;
      window.moreAvatar = moreAvatar;
    },
    { viewCss, avatarCss }
  );

  const initial = await page.evaluate(() => ({
    progress: getComputedStyle(window.screenShareBorder)
      .getPropertyValue('--rtk-screenshare-view-progress')
      .trim(),
    background: getComputedStyle(window.pendingAvatar).backgroundColor,
    text: getComputedStyle(window.pendingAvatar).color,
    moreBackground: getComputedStyle(window.moreAvatar).backgroundColor,
    moreText: getComputedStyle(window.moreAvatar).color,
  }));
  assert.equal(initial.progress, '0%');
  assert.equal(initial.moreBackground, initial.background);
  assert.equal(initial.moreText, initial.text);

  await page.evaluate(() => {
    window.screenShareBorder.classList.replace('none-active', 'complete');
    getComputedStyle(window.screenShareBorder).getPropertyValue('--rtk-screenshare-view-progress');
  });
  await page.waitForFunction(() =>
    window.screenShareBorder
      .getAnimations()
      .some((animation) => animation.transitionProperty === '--rtk-screenshare-view-progress')
  );
  const halfway = await page.evaluate(() => {
    const transition = window.screenShareBorder
      .getAnimations()
      .find((animation) => animation.transitionProperty === '--rtk-screenshare-view-progress');
    transition.pause();
    transition.currentTime = 250;
    return parseFloat(
      getComputedStyle(window.screenShareBorder).getPropertyValue('--rtk-screenshare-view-progress')
    );
  });
  assert.ok(halfway > 40 && halfway < 60, `Expected half-filled border, got ${halfway}%`);
});
