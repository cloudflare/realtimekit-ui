import type { RTKThemePreset, RTKPermissionsPreset } from '@cloudflare/realtimekit';
import { createDefaultConfig } from '../lib/default-ui-config';
import { UIConfig } from '../types/ui-config';
import { DesignTokens } from '../types/ui-config/design-tokens';
import { isValidHexColor } from './color';
import deepMerge from 'lodash-es/merge';
import { Meeting } from '../types/rtk-client';
import { isLiveStreamHost } from './livestream';

/**
 * Extend the default UI Config with your own
 * @param config Your extended UI Config
 * @returns New extended UI Config object
 */
export const extendConfig = (config: UIConfig, baseConfig: UIConfig = createDefaultConfig()) => {
  let newConfig = Object.assign({}, baseConfig);

  deepMerge(newConfig, config);

  return newConfig;
};

type ConfigData = {
  showSetupScreen: boolean;
};

type ConfigOptions = {
  grid_pagination?: boolean;
  settings_toggle?: boolean;
};

/**
 * Generates a config with older theme value.
 * @param oldConfig Theme object
 * @param toExtend UI Config object to extend the generated config
 * @param options Options for toggling components
 * @returns
 */
export const generateConfig = (
  oldConfig: Partial<RTKThemePreset>,
  meeting: Meeting,
  toExtend: UIConfig = {},
  options: ConfigOptions = { grid_pagination: true, settings_toggle: true }
): { config: UIConfig; data: ConfigData } => {
  const data: ConfigData = { showSetupScreen: true };

  let logo: string;

  let meetingElements = ['rtk-stage'];

  let headerChildren = {},
    controlBarChildren = {};

  const showSettingsToggle = options?.settings_toggle !== false;
  const showGridPagination = options?.grid_pagination !== false;

  if (oldConfig.controlBar?.isEnabled) {
    meetingElements.push('rtk-controlbar');

    const { elements } = oldConfig.controlBar;

    const leftElements = [
      ...(elements.fullscreen ? ['rtk-fullscreen-toggle'] : []),
      ...(showSettingsToggle ? ['rtk-settings-toggle'] : []),
    ];
    const rightElements = [];
    const moreElements = [];
    if (
      meeting.participants.pip?.isSupported() &&
      meeting.self?.config?.pipMode &&
      meeting.self.config?.viewType !== 'LIVESTREAM'
    ) {
      moreElements.push('rtk-pip-toggle');
    }

    if (meeting?.self.permissions.canDisableParticipantAudio) {
      moreElements.push('rtk-mute-all-button');
    }

    moreElements.push('rtk-breakout-rooms-toggle');

    if (meeting.self?.permissions.canRecord) {
      moreElements.push('rtk-recording-toggle');
    }

    if ((meeting.self.permissions as RTKPermissionsPreset).transcriptionEnabled ?? false) {
      moreElements.push('rtk-caption-toggle');
    }

    if (navigator.product !== 'ReactNative') moreElements.push('rtk-debugger-toggle');

    if (isLiveStreamHost(meeting)) {
      leftElements.push('rtk-livestream-toggle');
    }

    if (elements.screenshare) {
      leftElements.push('rtk-screen-share-toggle');
    }

    if (elements.chat) {
      rightElements.push('rtk-chat-toggle');
    }

    if (elements.polls) {
      rightElements.push('rtk-polls-toggle');
    }

    if (elements.participants) {
      rightElements.push('rtk-participants-toggle');
    }

    if (elements.plugins) {
      rightElements.push('rtk-plugins-toggle');
    }

    rightElements.push('rtk-ai-toggle');

    // NOTE(ishita1805): No condition as permission check happens within component
    const centerElements = [
      'rtk-mic-toggle',
      'rtk-camera-toggle',
      'rtk-stage-toggle',
      'rtk-leave-button',
    ];

    if (moreElements.length > 0) centerElements.push('rtk-more-toggle');

    const allSideElements = leftElements.concat(rightElements).concat(moreElements);

    let hasMobileDrawer = false;

    if (allSideElements.length > 0) {
      hasMobileDrawer = true;
    }

    controlBarChildren = {
      'rtk-controlbar': {
        states: ['activeMoreMenu'],
        children: ['div#controlbar-left', 'div#controlbar-center', 'div#controlbar-right'],
      },
      'div#controlbar-left': leftElements,
      'div#controlbar-center': centerElements,
      'div#controlbar-right': rightElements,
      'rtk-more-toggle': {
        states: ['activeMoreMenu'],
        children: [],
      },
      'rtk-more-toggle.activeMoreMenu': moreElements.map((el) => [
        el,
        { variant: 'horizontal', slot: 'more-elements' },
      ]),
      'rtk-controlbar.sm': ['div#controlbar-mobile'],
      'rtk-controlbar.md': ['div#controlbar-mobile'],

      'rtk-more-toggle.activeMoreMenu.md': allSideElements.map((el) => [
        el,
        { variant: 'horizontal', slot: 'more-elements' },
      ]),
      'rtk-more-toggle.activeMoreMenu.sm': allSideElements.map((el) => [
        el,
        { variant: 'horizontal', slot: 'more-elements' },
      ]),

      'div#controlbar-mobile': [
        'rtk-mic-toggle',
        'rtk-camera-toggle',
        'rtk-stage-toggle',
        ...[hasMobileDrawer && 'rtk-more-toggle'],
        'rtk-leave-button',
      ],
    };
  }

  if (oldConfig.header?.isEnabled) {
    meetingElements.unshift('rtk-header');

    const { elements } = oldConfig.header;

    let leftElements = ['rtk-recording-indicator', 'rtk-livestream-indicator'],
      centerElements = [],
      rightElements = [];

    if (showGridPagination) {
      rightElements.push('rtk-grid-pagination');
    }

    if (elements.title) {
      centerElements.push('rtk-meeting-title');
    }

    if (typeof elements.logo === 'string' && elements.logo.length > 0) {
      logo = elements.logo;
      leftElements.unshift('rtk-logo');
    }

    if (elements.participantCount) {
      rightElements.push('rtk-participant-count', 'rtk-viewer-count');
    }

    if (elements.timer) {
      rightElements.push('rtk-clock');
    }

    headerChildren = {
      'rtk-header': ['div#header-left', 'div#header-center', 'div#header-right'],
      'rtk-header.sm': { remove: ['div#header-center'] },

      'div#header-left': leftElements,
      'div#header-center': centerElements,
      'div#header-right': rightElements,

      'div#header-left.sm': {
        remove: ['rtk-logo'],
        prepend: ['rtk-meeting-title'],
      },
    };
  }

  meetingElements.push('rtk-participants-audio', 'rtk-dialog-manager');

  let designTokens: DesignTokens = {
    logo,
  };

  designTokens = oldConfig.designTokens;

  if (isValidHexColor(oldConfig?.designTokens?.colors?.textOnBrand)) {
    designTokens.colors['text-on-brand'] = oldConfig?.designTokens?.colors?.textOnBrand;
  }
  if (isValidHexColor(oldConfig?.designTokens?.colors?.videoBg)) {
    designTokens.colors['video-bg'] = oldConfig?.designTokens?.colors?.videoBg;
  }

  let config: UIConfig = {
    designTokens,
    styles: {
      'rtk-header': {
        display: 'grid',
        height: '48px',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: '1fr',
        alignItems: 'center',
        '--header-section-gap': 'var(--rtk-space-2, 8px)',
      },
      'rtk-header.sm': {
        display: 'grid',
        gridArea: 'header',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: '1fr',
        alignItems: 'center',
        '--header-section-gap': 'var(--rtk-space-1, 4px)',
      },
      'div#header-left': {
        display: 'flex',
        alignItems: 'center',
        height: '48px',
        wordBreak: 'break-all',
        gap: 'var(--header-section-gap)',
      },
      'rtk-logo': {
        height: '26px',
      },
      'div#header-center': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        wordBreak: 'break-all',
        gap: 'var(--header-section-gap)',
        paddingInline: 'var(--rtk-space-3, 12px)',
      },
      'div#header-right': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--header-section-gap)',
      },
      'rtk-stage': {
        display: 'flex',
        flex: '1',
      },
      'rtk-grid': {
        flex: '1',
        height: 'auto',
      },
      'rtk-controlbar': {
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gridTemplateRows: '1fr',
        alignItems: 'center',
        padding: '8px',
      },
      'rtk-controlbar.sm': {
        display: 'flex',
        position: 'relative',
        backgroundColor: 'var(--rtk-colors-background-1000, #000)',
      },
      'rtk-controlbar.md': {
        display: 'flex',
        position: 'relative',
        backgroundColor: 'var(--rtk-colors-background-1000, #000)',
      },
      'div#controlbar-left': {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--rtk-space-1, 4px)',
      },
      'div#controlbar-center': {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible',
        justifyContent: 'center',
        gap: 'var(--rtk-space-1, 4px)',
      },
      'div#controlbar-mobile': {
        display: 'flex',
        flex: '1',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10000',
        gap: 'var(--rtk-space-1, 4px)',
      },
      'div#controlbar-right': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--rtk-space-1, 4px)',
      },
      'rtk-settings': {
        width: '720px',
        height: '480px',
      },
      'rtk-debugger': {
        width: '720px',
        height: '480px',
      },
      'div#setupcontrols-indicator': {
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex',
        gap: '6px',
        background: 'rgb(var(--rtk-colors-background-800, 0 0 0))',
        borderRadius: '100%',
      },
      'div#setupcontrols-media': {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        display: 'flex',
        gap: '6px',
      },
      'div#setupcontrols-settings': {
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      },
      'rtk-meeting-title.sm': {
        marginLeft: '0',
      },
      'rtk-clock': {
        marginRight: '0',
      },
    },
    root: {
      'rtk-meeting': {
        // if using key value pair, provide the key in `state`
        // else provide array of states in `states`
        state: 'meeting',
        states: ['activeSidebar'],
      },
      'rtk-meeting[meeting=idle]': ['rtk-idle-screen'],
      'rtk-meeting[meeting=waiting]': ['rtk-waiting-screen'],
      'rtk-meeting[meeting=setup]': ['rtk-setup-screen', 'rtk-dialog-manager'],
      'rtk-meeting[meeting=joined]': meetingElements,
      'rtk-meeting[meeting=joined].activeSidebar.sm': {
        add: [['rtk-sidebar', { view: 'full-screen' }]],
      },
      'rtk-meeting[meeting=joined].activeSidebar.md': {
        add: [['rtk-sidebar', { view: 'full-screen' }]],
      },
      'rtk-meeting[meeting=ended]': ['rtk-ended-screen'],

      ...headerChildren,
      ...controlBarChildren,

      'rtk-stage': {
        states: ['activeSidebar'],
        children: ['rtk-grid', 'rtk-notifications', 'rtk-transcripts'],
      },

      'rtk-stage.activeSidebar': {
        add: [['rtk-sidebar', { view: 'sidebar' }]],
      },

      // hide sidebar for smaller screens
      'rtk-stage.activeSidebar.sm': { remove: ['rtk-sidebar'] },

      'rtk-grid': {
        states: ['activeScreenShare', 'activePlugin', 'activeSpotlight'],
        state: 'viewType',
        children: ['rtk-simple-grid'],
      },

      'rtk-grid[viewType=AUDIO_ROOM]': ['rtk-audio-grid'],

      'rtk-grid[viewType=AUDIO_ROOM].activePlugin': ['rtk-mixed-grid'],
      'rtk-grid[viewType=AUDIO_ROOM].activeScreenshare': ['rtk-mixed-grid'],
      'rtk-grid[viewType=AUDIO_ROOM].activeScreenShare.activeSpotlight': ['rtk-mixed-grid'],
      'rtk-grid[viewType=AUDIO_ROOM].activePlugin.activeSpotlight': ['rtk-mixed-grid'],
      'rtk-grid[viewType=AUDIO_ROOM].activePlugin.activeScreenShare.activeSpotlight': [
        'rtk-mixed-grid',
      ],

      'rtk-grid.activeSpotlight': ['rtk-spotlight-grid'],

      'rtk-grid.activeScreenShare': ['rtk-mixed-grid'],
      'rtk-grid.activePlugin': ['rtk-mixed-grid'],

      'rtk-grid.activeScreenShare.activeSpotlight': ['rtk-mixed-grid'],
      'rtk-grid.activePlugin.activeSpotlight': ['rtk-mixed-grid'],
      'rtk-grid.activePlugin.activeScreenShare.activeSpotlight': ['rtk-mixed-grid'],

      'rtk-mixed-grid': {
        states: ['activeSpotlight'],
        state: 'viewType',
        children: ['rtk-simple-grid'],
      },

      'rtk-mixed-grid[viewType=AUDIO_ROOM]': ['rtk-audio-grid'],

      'rtk-mixed-grid.activeSpotlight': ['rtk-spotlight-grid'],

      'rtk-participant-tile': {
        state: 'meeting',
        children: ['rtk-name-tag', 'rtk-avatar', 'rtk-network-indicator'],
      },

      'rtk-participant-setup': ['rtk-avatar', 'div#setupcontrols-media'],

      'rtk-participant-tile[meeting=setup]': [
        'rtk-avatar',
        'div#setupcontrols-indicator',
        'div#setupcontrols-media',
        ...(showSettingsToggle ? ['div#setupcontrols-settings'] : []),
      ],
      'div#setupcontrols-indicator': [['rtk-audio-visualizer', { slot: 'start', hideMuted: true }]],
      'div#setupcontrols-media': [
        ['rtk-mic-toggle', { size: 'sm' }],
        ['rtk-camera-toggle', { size: 'sm' }],
      ],
      'div#setupcontrols-settings': [['rtk-settings-toggle', { size: 'sm' }]],

      'rtk-screenshare-view': ['rtk-name-tag', 'rtk-network-indicator'],

      'rtk-name-tag': [['rtk-audio-visualizer', { slot: 'start' }]],
    },
    config: {
      notification_sounds: {
        participant_left: false,
      },
      participant_joined_sound_notification_limit: 3,
      participant_chat_message_sound_notification_limit: 10,
      videoFit: 'cover',
    },
  };

  config = extendConfig(toExtend, config);

  data.showSetupScreen = oldConfig.setupScreen?.isEnabled ?? true;

  return { config, data };
};
