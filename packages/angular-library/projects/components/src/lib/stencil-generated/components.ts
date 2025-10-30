/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import { Components } from '@cloudflare/realtimekit-ui';


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't', 'view']
})
@Component({
  selector: 'rtk-ai',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't', 'view'],
})
export class RtkAi {
  protected el: HTMLRtkAiElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkAiStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkAi extends Components.RtkAi {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkAiStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-ai-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkAiToggle {
  protected el: HTMLRtkAiToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkAiToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkAiToggle extends Components.RtkAiToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkAiToggleStates>>;
}


@ProxyCmp({
  inputs: ['initialTranscriptions', 'meeting', 't']
})
@Component({
  selector: 'rtk-ai-transcriptions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['initialTranscriptions', 'meeting', 't'],
})
export class RtkAiTranscriptions {
  protected el: HTMLRtkAiTranscriptionsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkAiTranscriptions extends Components.RtkAiTranscriptions {}


@ProxyCmp({
  inputs: ['config', 'hideSelf', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-audio-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'hideSelf', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkAudioGrid {
  protected el: HTMLRtkAudioGridElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkAudioGrid extends Components.RtkAudioGrid {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'participant', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-audio-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'participant', 'size', 'states', 't'],
})
export class RtkAudioTile {
  protected el: HTMLRtkAudioTileElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkAudioTile extends Components.RtkAudioTile {}


@ProxyCmp({
  inputs: ['hideMuted', 'iconPack', 'isScreenShare', 'participant', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-audio-visualizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['hideMuted', 'iconPack', 'isScreenShare', 'participant', 'size', 't', 'variant'],
})
export class RtkAudioVisualizer {
  protected el: HTMLRtkAudioVisualizerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkAudioVisualizer extends Components.RtkAudioVisualizer {}


@ProxyCmp({
  inputs: ['iconPack', 'participant', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'participant', 'size', 't', 'variant'],
})
export class RtkAvatar {
  protected el: HTMLRtkAvatarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkAvatar extends Components.RtkAvatar {}


@ProxyCmp({
  inputs: ['allowDelete', 'assigningParticipants', 'defaultExpanded', 'iconPack', 'isDragMode', 'meeting', 'mode', 'room', 'states', 't']
})
@Component({
  selector: 'rtk-breakout-room-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['allowDelete', 'assigningParticipants', 'defaultExpanded', 'iconPack', 'isDragMode', 'meeting', 'mode', 'room', 'states', 't'],
})
export class RtkBreakoutRoomManager {
  protected el: HTMLRtkBreakoutRoomManagerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['participantsAdd', 'participantDelete', 'roomJoin', 'delete', 'update']);
  }
}


export declare interface RtkBreakoutRoomManager extends Components.RtkBreakoutRoomManager {
  /**
   * Event for adding a participant
   */
  participantsAdd: EventEmitter<CustomEvent<null>>;
  /**
   * On Delete event emitter
   */
  participantDelete: EventEmitter<CustomEvent<{ customParticipantId: string; }>>;
  /**
   * Event for joining a room
   */
  roomJoin: EventEmitter<CustomEvent<null>>;
  /**
   * Event for deleting room
   */
  delete: EventEmitter<CustomEvent<string>>;
  /**
   * Event for updating room details
   */
  update: EventEmitter<CustomEvent<{ title: string | undefined; id: string; }>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'participantIds', 'selectedParticipantIds', 't']
})
@Component({
  selector: 'rtk-breakout-room-participants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'participantIds', 'selectedParticipantIds', 't'],
})
export class RtkBreakoutRoomParticipants {
  protected el: HTMLRtkBreakoutRoomParticipantsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['selectedParticipantsUpdate', 'allParticipantsToggleUpdate', 'participantsDragging']);
  }
}


export declare interface RtkBreakoutRoomParticipants extends Components.RtkBreakoutRoomParticipants {
  /**
   * Emits an event when selected participants are updated
   */
  selectedParticipantsUpdate: EventEmitter<CustomEvent<string[]>>;
  /**
   * Emits an event when all participants are selected or deselected
   */
  allParticipantsToggleUpdate: EventEmitter<CustomEvent<string[]>>;
  /**
   * Emits an event when participants are dragged
   */
  participantsDragging: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-breakout-rooms-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkBreakoutRoomsManager {
  protected el: HTMLRtkBreakoutRoomsManagerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { PartialStateEvent as IRtkBreakoutRoomsManagerPartialStateEvent } from '@cloudflare/realtimekit-ui';

export declare interface RtkBreakoutRoomsManager extends Components.RtkBreakoutRoomsManager {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkBreakoutRoomsManagerPartialStateEvent>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-breakout-rooms-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkBreakoutRoomsToggle {
  protected el: HTMLRtkBreakoutRoomsToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { PartialStateEvent as IRtkBreakoutRoomsTogglePartialStateEvent } from '@cloudflare/realtimekit-ui';

export declare interface RtkBreakoutRoomsToggle extends Components.RtkBreakoutRoomsToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkBreakoutRoomsTogglePartialStateEvent>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-broadcast-message-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkBroadcastMessageModal {
  protected el: HTMLRtkBroadcastMessageModalElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkBroadcastMessageModalStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkBroadcastMessageModal extends Components.RtkBroadcastMessageModal {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkBroadcastMessageModalStates>>;
}


@ProxyCmp({
  inputs: ['disabled', 'kind', 'reverse', 'size', 'type', 'variant']
})
@Component({
  selector: 'rtk-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'kind', 'reverse', 'size', 'type', 'variant'],
})
export class RtkButton {
  protected el: HTMLRtkButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkButton extends Components.RtkButton {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-camera-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkCameraSelector {
  protected el: HTMLRtkCameraSelectorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkCameraSelector extends Components.RtkCameraSelector {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-camera-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkCameraToggle {
  protected el: HTMLRtkCameraToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkCameraToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkCameraToggle extends Components.RtkCameraToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkCameraToggleStates>>;
}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-caption-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkCaptionToggle {
  protected el: HTMLRtkCaptionToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkCaptionToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkCaptionToggle extends Components.RtkCaptionToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkCaptionToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 't']
})
@Component({
  selector: 'rtk-channel-creator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 't'],
})
export class RtkChannelCreator {
  protected el: HTMLRtkChannelCreatorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate', 'switchChannel']);
  }
}


import type { States as IRtkChannelCreatorStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkChannelCreator extends Components.RtkChannelCreator {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkChannelCreatorStates>>;
  /**
   * Emits event to switch channel
   */
  switchChannel: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['channel', 'iconPack', 'members', 't']
})
@Component({
  selector: 'rtk-channel-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['channel', 'iconPack', 'members', 't'],
})
export class RtkChannelDetails {
  protected el: HTMLRtkChannelDetailsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkChannelDetails extends Components.RtkChannelDetails {}


@ProxyCmp({
  inputs: ['channel', 'iconPack', 'meeting', 'showBackButton', 't']
})
@Component({
  selector: 'rtk-channel-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['channel', 'iconPack', 'meeting', 'showBackButton', 't'],
})
export class RtkChannelHeader {
  protected el: HTMLRtkChannelHeaderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['search', 'searchDismissed', 'back']);
  }
}


export declare interface RtkChannelHeader extends Components.RtkChannelHeader {
  /**
   * event triggered for search
   */
  search: EventEmitter<CustomEvent<string>>;
  /**
   * event triggered for search
   */
  searchDismissed: EventEmitter<CustomEvent<any>>;
  /**
   * Event emitted when back button is clicked
   */
  back: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['channels', 'iconPack', 'selectedChannelId', 'showRecentMessage', 't']
})
@Component({
  selector: 'rtk-channel-selector-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['channels', 'iconPack', 'selectedChannelId', 'showRecentMessage', 't'],
})
export class RtkChannelSelectorUi {
  protected el: HTMLRtkChannelSelectorUiElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['channelChanged']);
  }
}


export declare interface RtkChannelSelectorUi extends Components.RtkChannelSelectorUi {
  /**
   * On channel changed
   */
  channelChanged: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['channels', 'disableSearch', 'hideAvatar', 'iconPack', 'selectedChannelId', 't', 'viewAs']
})
@Component({
  selector: 'rtk-channel-selector-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['channels', 'disableSearch', 'hideAvatar', 'iconPack', 'selectedChannelId', 't', 'viewAs'],
})
export class RtkChannelSelectorView {
  protected el: HTMLRtkChannelSelectorViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['channelChange']);
  }
}


import type { IconPack as IRtkChannelSelectorViewIconPack } from '@cloudflare/realtimekit-ui';

export declare interface RtkChannelSelectorView extends Components.RtkChannelSelectorView {
  /**
   * Event emitted when selected channel changes
   */
  channelChange: EventEmitter<CustomEvent<{ id: string; name: string; avatarUrl?: string; icon?: keyof IRtkChannelSelectorViewIconPack; latestMessage?: string; latestMessageTime?: Date; unreadCount?: number; }>>;
}


@ProxyCmp({
  inputs: ['config', 'disablePrivateChat', 'displayFilter', 'iconPack', 'meeting', 'privatePresetFilter', 'size', 't']
})
@Component({
  selector: 'rtk-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'disablePrivateChat', 'displayFilter', 'iconPack', 'meeting', 'privatePresetFilter', 'size', 't'],
})
export class RtkChat {
  protected el: HTMLRtkChatElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkChatStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkChat extends Components.RtkChat {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkChatStates>>;
}


@ProxyCmp({
  inputs: ['canSendFiles', 'canSendTextMessage', 'channelId', 'disableEmojiPicker', 'iconPack', 'members', 'prefill', 'size', 't']
})
@Component({
  selector: 'rtk-chat-composer-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['canSendFiles', 'canSendTextMessage', 'channelId', 'disableEmojiPicker', 'iconPack', 'members', 'prefill', 'size', 't'],
})
export class RtkChatComposerUi {
  protected el: HTMLRtkChatComposerUiElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkNewMessage', 'rtkEditMessage', 'rtkEditCancelled']);
  }
}


import type { RtkNewMessageEvent as IRtkChatComposerUiRtkNewMessageEvent } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatComposerUi extends Components.RtkChatComposerUi {
  /**
   * Event emitted when new message is submitted
   */
  rtkNewMessage: EventEmitter<CustomEvent<IRtkChatComposerUiRtkNewMessageEvent>>;
  /**
   * Event emitted when message is edited
   */
  rtkEditMessage: EventEmitter<CustomEvent<{ id: string; message: string; channelId?: string; }>>;
  /**
   * Event emitted when message editing is cancelled
   */
  rtkEditCancelled: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  inputs: ['canSendFiles', 'canSendTextMessage', 'disableEmojiPicker', 'iconPack', 'inputTextPlaceholder', 'isEditing', 'maxLength', 'message', 'quotedMessage', 'rateLimits', 'storageKey', 't']
})
@Component({
  selector: 'rtk-chat-composer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['canSendFiles', 'canSendTextMessage', 'disableEmojiPicker', 'iconPack', 'inputTextPlaceholder', 'isEditing', 'maxLength', 'message', 'quotedMessage', 'rateLimits', 'storageKey', 't'],
})
export class RtkChatComposerView {
  protected el: HTMLRtkChatComposerViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['newMessage', 'editMessage', 'editCancel', 'quotedMessageDismiss']);
  }
}


import type { NewMessageEvent as IRtkChatComposerViewNewMessageEvent } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatComposerView extends Components.RtkChatComposerView {
  /**
   * Event emitted when new message is submitted
   */
  newMessage: EventEmitter<CustomEvent<IRtkChatComposerViewNewMessageEvent>>;
  /**
   * Event emitted when message is edited
   */
  editMessage: EventEmitter<CustomEvent<string>>;
  /**
   * Event emitted when message editing is cancelled
   */
  editCancel: EventEmitter<CustomEvent<void>>;
  /**
   * Event emitted when quoted message is dismissed
   */
  quotedMessageDismiss: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['alignRight', 'canDelete', 'canEdit', 'canPin', 'canReply', 'child', 'disableControls', 'hideAvatar', 'iconPack', 'isContinued', 'isSelf', 'isUnread', 'leftAlign', 'message', 'senderDisplayPicture', 'size', 't']
})
@Component({
  selector: 'rtk-chat-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['alignRight', 'canDelete', 'canEdit', 'canPin', 'canReply', 'child', 'disableControls', 'hideAvatar', 'iconPack', 'isContinued', 'isSelf', 'isUnread', 'leftAlign', 'message', 'senderDisplayPicture', 'size', 't'],
})
export class RtkChatMessage {
  protected el: HTMLRtkChatMessageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['edit', 'reply', 'pin', 'delete']);
  }
}


import type { Message as IRtkChatMessageMessage } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatMessage extends Components.RtkChatMessage {
  /**
   * Event for when edit is clicked on a message
   */
  edit: EventEmitter<CustomEvent<IRtkChatMessageMessage>>;
  /**
   * Event for when reply is clicked on a message
   */
  reply: EventEmitter<CustomEvent<IRtkChatMessageMessage>>;
  /**
   * Event for when pin is clicked on a message
   */
  pin: EventEmitter<CustomEvent<IRtkChatMessageMessage>>;
  /**
   * Event for when edit is clicked on a message
   */
  delete: EventEmitter<CustomEvent<IRtkChatMessageMessage>>;
}


@ProxyCmp({
  inputs: ['canPinMessages', 'iconPack', 'messages', 'selectedGroup', 'selfUserId', 'size', 't']
})
@Component({
  selector: 'rtk-chat-messages-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['canPinMessages', 'iconPack', 'messages', 'selectedGroup', 'selfUserId', 'size', 't'],
})
export class RtkChatMessagesUi {
  protected el: HTMLRtkChatMessagesUiElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['pinMessage', 'rtkStateUpdate']);
  }
}


import type { Message as IRtkChatMessagesUiMessage } from '@cloudflare/realtimekit-ui';
import type { States as IRtkChatMessagesUiStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatMessagesUi extends Components.RtkChatMessagesUi {
  /**
   * Event emitted when a message is pinned or unpinned
   */
  pinMessage: EventEmitter<CustomEvent<IRtkChatMessagesUiMessage>>;
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkChatMessagesUiStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'leftAlign', 'meeting', 'selectedChannel', 'selectedChannelId', 'size', 't']
})
@Component({
  selector: 'rtk-chat-messages-ui-paginated',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'leftAlign', 'meeting', 'selectedChannel', 'selectedChannelId', 'size', 't'],
})
export class RtkChatMessagesUiPaginated {
  protected el: HTMLRtkChatMessagesUiPaginatedElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['editMessageInit', 'pinMessage', 'deleteMessage', 'rtkStateUpdate']);
  }
}


import type { TextMessage as IRtkChatMessagesUiPaginatedTextMessage } from '@cloudflare/realtimekit-ui';
import type { Message as IRtkChatMessagesUiPaginatedMessage } from '@cloudflare/realtimekit-ui';
import type { States as IRtkChatMessagesUiPaginatedStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatMessagesUiPaginated extends Components.RtkChatMessagesUiPaginated {
  /**
   * Event for editing a message
   */
  editMessageInit: EventEmitter<CustomEvent<{ payload: IRtkChatMessagesUiPaginatedTextMessage; flags: { isReply?: boolean; isEdit?: boolean }; }>>;
  /**
   * Event emitted when a message is pinned or unpinned
   */
  pinMessage: EventEmitter<CustomEvent<IRtkChatMessagesUiPaginatedMessage>>;
  /**
   * Event emitted when a message is deleted
   */
  deleteMessage: EventEmitter<CustomEvent<IRtkChatMessagesUiPaginatedMessage>>;
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkChatMessagesUiPaginatedStates>>;
}


@ProxyCmp({
  inputs: ['channelId', 'iconPack', 'meeting', 'query', 't']
})
@Component({
  selector: 'rtk-chat-search-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['channelId', 'iconPack', 'meeting', 'query', 't'],
})
export class RtkChatSearchResults {
  protected el: HTMLRtkChatSearchResultsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkChatSearchResults extends Components.RtkChatSearchResults {}


@ProxyCmp({
  inputs: ['groups', 'iconPack', 'selectedGroupId', 'selfUserId', 't', 'unreadCounts']
})
@Component({
  selector: 'rtk-chat-selector-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['groups', 'iconPack', 'selectedGroupId', 'selfUserId', 't', 'unreadCounts'],
})
export class RtkChatSelectorUi {
  protected el: HTMLRtkChatSelectorUiElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkChatGroupChanged']);
  }
}


import type { ChatGroupChangedType as IRtkChatSelectorUiChatGroupChangedType } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatSelectorUi extends Components.RtkChatSelectorUi {
  /**
   * Event emitted when chat scope is changed
   */
  rtkChatGroupChanged: EventEmitter<CustomEvent<IRtkChatSelectorUiChatGroupChangedType>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-chat-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkChatToggle {
  protected el: HTMLRtkChatToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkChatToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkChatToggle extends Components.RtkChatToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkChatToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size']
})
@Component({
  selector: 'rtk-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size'],
})
export class RtkClock {
  protected el: HTMLRtkClockElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkClock extends Components.RtkClock {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-confirmation-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkConfirmationModal {
  protected el: HTMLRtkConfirmationModalElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkConfirmationModalStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkConfirmationModal extends Components.RtkConfirmationModal {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkConfirmationModalStates>>;
}


@ProxyCmp({
  inputs: ['config', 'disableRender', 'iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-controlbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'disableRender', 'iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkControlbar {
  protected el: HTMLRtkControlbarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkControlbar extends Components.RtkControlbar {}


@ProxyCmp({
  inputs: ['brandIcon', 'disabled', 'icon', 'iconPack', 'isLoading', 'label', 'showWarning', 'size', 'variant']
})
@Component({
  selector: 'rtk-controlbar-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['brandIcon', 'disabled', 'icon', 'iconPack', 'isLoading', 'label', 'showWarning', 'size', 'variant'],
})
export class RtkControlbarButton {
  protected el: HTMLRtkControlbarButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkControlbarButton extends Components.RtkControlbarButton {}


@ProxyCmp({
  inputs: ['iconPack', 'minValue', 'size', 't', 'value']
})
@Component({
  selector: 'rtk-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'minValue', 'size', 't', 'value'],
})
export class RtkCounter {
  protected el: HTMLRtkCounterElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['valueChange']);
  }
}


export declare interface RtkCounter extends Components.RtkCounter {
  /**
   * On change event emitter
   */
  valueChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-debugger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkDebugger {
  protected el: HTMLRtkDebuggerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkDebuggerStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkDebugger extends Components.RtkDebugger {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkDebuggerStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-debugger-audio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkDebuggerAudio {
  protected el: HTMLRtkDebuggerAudioElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkDebuggerAudio extends Components.RtkDebuggerAudio {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-debugger-screenshare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkDebuggerScreenshare {
  protected el: HTMLRtkDebuggerScreenshareElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkDebuggerScreenshare extends Components.RtkDebuggerScreenshare {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-debugger-system',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkDebuggerSystem {
  protected el: HTMLRtkDebuggerSystemElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkDebuggerSystem extends Components.RtkDebuggerSystem {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-debugger-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkDebuggerToggle {
  protected el: HTMLRtkDebuggerToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkDebuggerToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkDebuggerToggle extends Components.RtkDebuggerToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkDebuggerToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-debugger-video',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkDebuggerVideo {
  protected el: HTMLRtkDebuggerVideoElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkDebuggerVideo extends Components.RtkDebuggerVideo {}


@ProxyCmp({
  inputs: ['config', 'disableEscapeKey', 'hideCloseButton', 'iconPack', 'meeting', 'open', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'disableEscapeKey', 'hideCloseButton', 'iconPack', 'meeting', 'open', 'size', 'states', 't'],
})
export class RtkDialog {
  protected el: HTMLRtkDialogElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkDialogClose']);
  }
}


export declare interface RtkDialog extends Components.RtkDialog {
  /**
   * Event emitted when dialog is closed
   */
  rtkDialogClose: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-dialog-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkDialogManager {
  protected el: HTMLRtkDialogManagerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkDialogManagerStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkDialogManager extends Components.RtkDialogManager {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkDialogManagerStates>>;
}


@ProxyCmp({
  inputs: ['attachment', 'iconPack', 't']
})
@Component({
  selector: 'rtk-draft-attachment-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['attachment', 'iconPack', 't'],
})
export class RtkDraftAttachmentView {
  protected el: HTMLRtkDraftAttachmentViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['deleteAttachment']);
  }
}


export declare interface RtkDraftAttachmentView extends Components.RtkDraftAttachmentView {
  /**
   * Event triggered when the attachment is deleted
   */
  deleteAttachment: EventEmitter<CustomEvent<any>>;
}


@ProxyCmp({
  inputs: ['focusWhenOpened', 'iconPack', 't']
})
@Component({
  selector: 'rtk-emoji-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['focusWhenOpened', 'iconPack', 't'],
})
export class RtkEmojiPicker {
  protected el: HTMLRtkEmojiPickerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['pickerClose', 'rtkEmojiClicked']);
  }
}


export declare interface RtkEmojiPicker extends Components.RtkEmojiPicker {
  /**
   * Close event
   */
  pickerClose: EventEmitter<CustomEvent<void>>;
  /**
   * Event which is emitted when an Emoji is clicked
   */
  rtkEmojiClicked: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'isActive', 't']
})
@Component({
  selector: 'rtk-emoji-picker-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'isActive', 't'],
})
export class RtkEmojiPickerButton {
  protected el: HTMLRtkEmojiPickerButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkEmojiPickerButton extends Components.RtkEmojiPickerButton {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-ended-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkEndedScreen {
  protected el: HTMLRtkEndedScreenElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkEndedScreen extends Components.RtkEndedScreen {}


@ProxyCmp({
  inputs: ['hostEl', 'iconPack', 't']
})
@Component({
  selector: 'rtk-file-dropzone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['hostEl', 'iconPack', 't'],
})
export class RtkFileDropzone {
  protected el: HTMLRtkFileDropzoneElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['dropCallback']);
  }
}


export declare interface RtkFileDropzone extends Components.RtkFileDropzone {
  /**
   * drop event callback
   */
  dropCallback: EventEmitter<CustomEvent<DragEvent>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'isContinued', 'message', 'now', 'showBubble', 't']
})
@Component({
  selector: 'rtk-file-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'isContinued', 'message', 'now', 'showBubble', 't'],
})
export class RtkFileMessage {
  protected el: HTMLRtkFileMessageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkFileMessage extends Components.RtkFileMessage {}


@ProxyCmp({
  inputs: ['iconPack', 'name', 'size', 'url']
})
@Component({
  selector: 'rtk-file-message-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'name', 'size', 'url'],
})
export class RtkFileMessageView {
  protected el: HTMLRtkFileMessageViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkFileMessageView extends Components.RtkFileMessageView {}


@ProxyCmp({
  inputs: ['filter', 'icon', 'iconPack', 'label', 't']
})
@Component({
  selector: 'rtk-file-picker-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['filter', 'icon', 'iconPack', 'label', 't'],
})
export class RtkFilePickerButton {
  protected el: HTMLRtkFilePickerButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['fileChange']);
  }
}


export declare interface RtkFilePickerButton extends Components.RtkFilePickerButton {
  /**
   * Event when a file is selected for upload
   */
  fileChange: EventEmitter<CustomEvent<File>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'size', 'states', 't', 'targetElement', 'variant']
})
@Component({
  selector: 'rtk-fullscreen-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'size', 'states', 't', 'targetElement', 'variant'],
})
export class RtkFullscreenToggle {
  protected el: HTMLRtkFullscreenToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkFullscreenToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkFullscreenToggle extends Components.RtkFullscreenToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkFullscreenToggleStates>>;
}


@ProxyCmp({
  inputs: ['aspectRatio', 'config', 'gap', 'gridSize', 'iconPack', 'layout', 'meeting', 'overrides', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['aspectRatio', 'config', 'gap', 'gridSize', 'iconPack', 'layout', 'meeting', 'overrides', 'size', 'states', 't'],
})
export class RtkGrid {
  protected el: HTMLRtkGridElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkGridStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkGrid extends Components.RtkGrid {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkGridStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-grid-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkGridPagination {
  protected el: HTMLRtkGridPaginationElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkGridPagination extends Components.RtkGridPagination {}


@ProxyCmp({
  inputs: ['config', 'disableRender', 'iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'disableRender', 'iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkHeader {
  protected el: HTMLRtkHeaderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkHeader extends Components.RtkHeader {}


@ProxyCmp({
  inputs: ['icon', 'size', 'variant']
})
@Component({
  selector: 'rtk-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['icon', 'size', 'variant'],
})
export class RtkIcon {
  protected el: HTMLRtkIconElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkIcon extends Components.RtkIcon {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 't']
})
@Component({
  selector: 'rtk-idle-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 't'],
})
export class RtkIdleScreen {
  protected el: HTMLRtkIdleScreenElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkIdleScreen extends Components.RtkIdleScreen {}


@ProxyCmp({
  inputs: ['iconPack', 'isContinued', 'message', 'now', 'showBubble', 't']
})
@Component({
  selector: 'rtk-image-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'isContinued', 'message', 'now', 'showBubble', 't'],
})
export class RtkImageMessage {
  protected el: HTMLRtkImageMessageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkImageMessageStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkImageMessage extends Components.RtkImageMessage {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkImageMessageStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 't', 'url']
})
@Component({
  selector: 'rtk-image-message-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 't', 'url'],
})
export class RtkImageMessageView {
  protected el: HTMLRtkImageMessageViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['preview']);
  }
}


export declare interface RtkImageMessageView extends Components.RtkImageMessageView {
  /**
   * preview event
   */
  preview: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'image', 'size', 't']
})
@Component({
  selector: 'rtk-image-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'image', 'size', 't'],
})
export class RtkImageViewer {
  protected el: HTMLRtkImageViewerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['close']);
  }
}


export declare interface RtkImageViewer extends Components.RtkImageViewer {
  /**
   * Emitted when viewer should be closed
   */
  close: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['iconPack']
})
@Component({
  selector: 'rtk-information-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack'],
})
export class RtkInformationTooltip {
  protected el: HTMLRtkInformationTooltipElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkInformationTooltip extends Components.RtkInformationTooltip {}


@ProxyCmp({
  inputs: ['config', 'dataConfig', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-join-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'dataConfig', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkJoinStage {
  protected el: HTMLRtkJoinStageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate', 'rtkJoinStage', 'rtkLeaveStage']);
  }
}


import type { States as IRtkJoinStageStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkJoinStage extends Components.RtkJoinStage {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkJoinStageStates>>;
  /**
   * Event which is emitted when user confirms joining stage
   */
  rtkJoinStage: EventEmitter<CustomEvent<void>>;
  /**
   * Event which is emitted when user cancel joining stage
   */
  rtkLeaveStage: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-leave-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'size', 't', 'variant'],
})
export class RtkLeaveButton {
  protected el: HTMLRtkLeaveButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkLeaveButtonStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkLeaveButton extends Components.RtkLeaveButton {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkLeaveButtonStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-leave-meeting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkLeaveMeeting {
  protected el: HTMLRtkLeaveMeetingElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkLeaveMeetingStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkLeaveMeeting extends Components.RtkLeaveMeeting {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkLeaveMeetingStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-livestream-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't'],
})
export class RtkLivestreamIndicator {
  protected el: HTMLRtkLivestreamIndicatorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkLivestreamIndicator extends Components.RtkLivestreamIndicator {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-livestream-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't'],
})
export class RtkLivestreamPlayer {
  protected el: HTMLRtkLivestreamPlayerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkApiError']);
  }
}


export declare interface RtkLivestreamPlayer extends Components.RtkLivestreamPlayer {
  /**
   * Emit API error events
   */
  rtkApiError: EventEmitter<CustomEvent<{ trace: string; message: string; }>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-livestream-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkLivestreamToggle {
  protected el: HTMLRtkLivestreamToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate', 'rtkApiError']);
  }
}


import type { States as IRtkLivestreamToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkLivestreamToggle extends Components.RtkLivestreamToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkLivestreamToggleStates>>;
  /**
   * Emit API error events
   */
  rtkApiError: EventEmitter<CustomEvent<{ trace: string; message: string; }>>;
}


@ProxyCmp({
  inputs: ['config', 'logoUrl', 'meeting', 't']
})
@Component({
  selector: 'rtk-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'logoUrl', 'meeting', 't'],
})
export class RtkLogo {
  protected el: HTMLRtkLogoElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkLogo extends Components.RtkLogo {}


@ProxyCmp({
  inputs: ['maxLength', 'text']
})
@Component({
  selector: 'rtk-markdown-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['maxLength', 'text'],
})
export class RtkMarkdownView {
  protected el: HTMLRtkMarkdownViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMarkdownView extends Components.RtkMarkdownView {}


@ProxyCmp({
  inputs: ['applyDesignSystem', 'config', 'gridLayout', 'iconPack', 'leaveOnUnmount', 'loadConfigFromPreset', 'meeting', 'mode', 'showSetupScreen', 'size', 't']
})
@Component({
  selector: 'rtk-meeting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['applyDesignSystem', 'config', 'gridLayout', 'iconPack', 'leaveOnUnmount', 'loadConfigFromPreset', 'meeting', 'mode', 'showSetupScreen', 'size', 't'],
})
export class RtkMeeting {
  protected el: HTMLRtkMeetingElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStatesUpdate']);
  }
}


import type { States as IRtkMeetingStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkMeeting extends Components.RtkMeeting {
  /**
   * Emits `rtkStatesUpdate` so that developers can listen to onRtkStatesUpdate and update their own stores
Do not confuse this with `rtkStateUpdate` that other components emit
   */
  rtkStatesUpdate: EventEmitter<CustomEvent<IRtkMeetingStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 't']
})
@Component({
  selector: 'rtk-meeting-title',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 't'],
})
export class RtkMeetingTitle {
  protected el: HTMLRtkMeetingTitleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMeetingTitle extends Components.RtkMeetingTitle {}


@ProxyCmp({
  inputs: ['iconPack', 'offset', 'placement', 'size', 't']
})
@Component({
  selector: 'rtk-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'offset', 'placement', 'size', 't'],
})
export class RtkMenu {
  protected el: HTMLRtkMenuElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMenu extends Components.RtkMenu {}


@ProxyCmp({
  inputs: ['iconPack', 'size', 't']
})
@Component({
  selector: 'rtk-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'size', 't'],
})
export class RtkMenuItem {
  protected el: HTMLRtkMenuItemElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMenuItem extends Components.RtkMenuItem {}


@ProxyCmp({
  inputs: ['iconPack', 't']
})
@Component({
  selector: 'rtk-menu-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 't'],
})
export class RtkMenuList {
  protected el: HTMLRtkMenuListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMenuList extends Components.RtkMenuList {}


@ProxyCmp({
  inputs: ['estimateItemSize', 'iconPack', 'loadMore', 'messages', 'renderer', 'visibleItemsCount']
})
@Component({
  selector: 'rtk-message-list-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['estimateItemSize', 'iconPack', 'loadMore', 'messages', 'renderer', 'visibleItemsCount'],
})
export class RtkMessageListView {
  protected el: HTMLRtkMessageListViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMessageListView extends Components.RtkMessageListView {}


@ProxyCmp({
  inputs: ['actions', 'authorName', 'avatarUrl', 'hideAuthorName', 'hideAvatar', 'hideMetadata', 'iconPack', 'time', 'variant', 'viewType']
})
@Component({
  selector: 'rtk-message-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['actions', 'authorName', 'avatarUrl', 'hideAuthorName', 'hideAvatar', 'hideMetadata', 'iconPack', 'time', 'variant', 'viewType'],
})
export class RtkMessageView {
  protected el: HTMLRtkMessageViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['action']);
  }
}


export declare interface RtkMessageView extends Components.RtkMessageView {
  /**
   * action event
   */
  action: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-mic-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkMicToggle {
  protected el: HTMLRtkMicToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkMicToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkMicToggle extends Components.RtkMicToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkMicToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-microphone-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkMicrophoneSelector {
  protected el: HTMLRtkMicrophoneSelectorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMicrophoneSelector extends Components.RtkMicrophoneSelector {}


@ProxyCmp({
  inputs: ['aspectRatio', 'config', 'gap', 'gridSize', 'iconPack', 'layout', 'meeting', 'participants', 'pinnedParticipants', 'plugins', 'screenShareParticipants', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-mixed-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['aspectRatio', 'config', 'gap', 'gridSize', 'iconPack', 'layout', 'meeting', 'participants', 'pinnedParticipants', 'plugins', 'screenShareParticipants', 'size', 'states', 't'],
})
export class RtkMixedGrid {
  protected el: HTMLRtkMixedGridElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkMixedGrid extends Components.RtkMixedGrid {}


@ProxyCmp({
  inputs: ['iconPack', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-more-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'size', 'states', 't'],
})
export class RtkMoreToggle {
  protected el: HTMLRtkMoreToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkMoreToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkMoreToggle extends Components.RtkMoreToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkMoreToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-mute-all-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkMuteAllButton {
  protected el: HTMLRtkMuteAllButtonElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkMuteAllButtonStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkMuteAllButton extends Components.RtkMuteAllButton {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkMuteAllButtonStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-mute-all-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkMuteAllConfirmation {
  protected el: HTMLRtkMuteAllConfirmationElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkMuteAllConfirmationStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkMuteAllConfirmation extends Components.RtkMuteAllConfirmation {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkMuteAllConfirmationStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'isScreenShare', 'meeting', 'participant', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-name-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'isScreenShare', 'meeting', 'participant', 'size', 't', 'variant'],
})
export class RtkNameTag {
  protected el: HTMLRtkNameTagElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkNameTag extends Components.RtkNameTag {}


@ProxyCmp({
  inputs: ['iconPack', 'isScreenShare', 'meeting', 'participant', 't']
})
@Component({
  selector: 'rtk-network-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'isScreenShare', 'meeting', 'participant', 't'],
})
export class RtkNetworkIndicator {
  protected el: HTMLRtkNetworkIndicatorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkNetworkIndicator extends Components.RtkNetworkIndicator {}


@ProxyCmp({
  inputs: ['iconPack', 'notification', 'paused', 'size', 't']
})
@Component({
  selector: 'rtk-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'notification', 'paused', 'size', 't'],
})
export class RtkNotification {
  protected el: HTMLRtkNotificationElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkNotificationDismiss']);
  }
}


export declare interface RtkNotification extends Components.RtkNotification {
  /**
   * Dismiss event
   */
  rtkNotificationDismiss: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkNotifications {
  protected el: HTMLRtkNotificationsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkNotifications extends Components.RtkNotifications {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-overlay-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkOverlayModal {
  protected el: HTMLRtkOverlayModalElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkOverlayModalStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkOverlayModal extends Components.RtkOverlayModal {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkOverlayModalStates>>;
}


@ProxyCmp({
  inputs: ['autoScroll', 'createNodes', 'emptyListLabel', 'fetchData', 'iconPack', 'pageSize', 'pagesAllowed', 'selectedItemId', 't'],
  methods: ['onNewNode', 'onNodeDelete', 'onNodeUpdate']
})
@Component({
  selector: 'rtk-paginated-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['autoScroll', 'createNodes', 'emptyListLabel', 'fetchData', 'iconPack', 'pageSize', 'pagesAllowed', 'selectedItemId', 't'],
})
export class RtkPaginatedList {
  protected el: HTMLRtkPaginatedListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkPaginatedList extends Components.RtkPaginatedList {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'participant', 'states', 't', 'view']
})
@Component({
  selector: 'rtk-participant',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'participant', 'states', 't', 'view'],
})
export class RtkParticipant {
  protected el: HTMLRtkParticipantElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkSendNotification']);
  }
}


export declare interface RtkParticipant extends Components.RtkParticipant {
  /**
   * Emit notifications
   */
  rtkSendNotification: EventEmitter<CustomEvent<{ trace: string; message: string; }>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-participant-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't'],
})
export class RtkParticipantCount {
  protected el: HTMLRtkParticipantCountElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkParticipantCount extends Components.RtkParticipantCount {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'isPreview', 'nameTagPosition', 'participant', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-participant-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'isPreview', 'nameTagPosition', 'participant', 'size', 'states', 't', 'variant'],
})
export class RtkParticipantSetup {
  protected el: HTMLRtkParticipantSetupElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkParticipantSetup extends Components.RtkParticipantSetup {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'isPreview', 'meeting', 'nameTagPosition', 'participant', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-participant-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'isPreview', 'meeting', 'nameTagPosition', 'participant', 'size', 'states', 't', 'variant'],
})
export class RtkParticipantTile {
  protected el: HTMLRtkParticipantTileElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['tileLoad', 'tileUnload']);
  }
}


import type { Peer as IRtkParticipantTilePeer } from '@cloudflare/realtimekit-ui';

export declare interface RtkParticipantTile extends Components.RtkParticipantTile {
  /**
   * Event triggered when tile is loaded
   */
  tileLoad: EventEmitter<CustomEvent<{ participant: IRtkParticipantTilePeer; videoElement: HTMLVideoElement }>>;
  /**
   * Event triggered when tile is unloaded
   */
  tileUnload: EventEmitter<CustomEvent<IRtkParticipantTilePeer>>;
}


@ProxyCmp({
  inputs: ['config', 'defaultParticipantsTabId', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-participants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'defaultParticipantsTabId', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkParticipants {
  protected el: HTMLRtkParticipantsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkParticipantsStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkParticipants extends Components.RtkParticipants {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkParticipantsStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'preloadedAudioElem', 't']
})
@Component({
  selector: 'rtk-participants-audio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'preloadedAudioElem', 't'],
})
export class RtkParticipantsAudio {
  protected el: HTMLRtkParticipantsAudioElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['dialogClose']);
  }
}


export declare interface RtkParticipantsAudio extends Components.RtkParticipantsAudio {
  /**
   * Callback to execute when the dialog is closed
   */
  dialogClose: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['config', 'hideHeader', 'iconPack', 'meeting', 'search', 'size', 'states', 't', 'view']
})
@Component({
  selector: 'rtk-participants-stage-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'hideHeader', 'iconPack', 'meeting', 'search', 'size', 'states', 't', 'view'],
})
export class RtkParticipantsStageList {
  protected el: HTMLRtkParticipantsStageListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkParticipantsStageList extends Components.RtkParticipantsStageList {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 't', 'view']
})
@Component({
  selector: 'rtk-participants-stage-queue',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 't', 'view'],
})
export class RtkParticipantsStageQueue {
  protected el: HTMLRtkParticipantsStageQueueElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkParticipantsStageQueue extends Components.RtkParticipantsStageQueue {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-participants-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkParticipantsToggle {
  protected el: HTMLRtkParticipantsToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkParticipantsToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkParticipantsToggle extends Components.RtkParticipantsToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkParticipantsToggleStates>>;
}


@ProxyCmp({
  inputs: ['config', 'hideHeader', 'iconPack', 'meeting', 'search', 'size', 't', 'view']
})
@Component({
  selector: 'rtk-participants-viewer-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'hideHeader', 'iconPack', 'meeting', 'search', 'size', 't', 'view'],
})
export class RtkParticipantsViewerList {
  protected el: HTMLRtkParticipantsViewerListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkParticipantsViewerList extends Components.RtkParticipantsViewerList {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 't', 'view']
})
@Component({
  selector: 'rtk-participants-waiting-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 't', 'view'],
})
export class RtkParticipantsWaitingList {
  protected el: HTMLRtkParticipantsWaitingListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkParticipantsWaitingList extends Components.RtkParticipantsWaitingList {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-permissions-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'states', 't'],
})
export class RtkPermissionsMessage {
  protected el: HTMLRtkPermissionsMessageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkPermissionsMessageStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkPermissionsMessage extends Components.RtkPermissionsMessage {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkPermissionsMessageStates>>;
}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-pip-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkPipToggle {
  protected el: HTMLRtkPipToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkPipToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkPipToggle extends Components.RtkPipToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkPipToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'plugin', 't']
})
@Component({
  selector: 'rtk-plugin-main',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'plugin', 't'],
})
export class RtkPluginMain {
  protected el: HTMLRtkPluginMainElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkPluginMain extends Components.RtkPluginMain {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-plugins',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 't'],
})
export class RtkPlugins {
  protected el: HTMLRtkPluginsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkPluginsStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkPlugins extends Components.RtkPlugins {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkPluginsStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-plugins-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkPluginsToggle {
  protected el: HTMLRtkPluginsToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkPluginsToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkPluginsToggle extends Components.RtkPluginsToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkPluginsToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'permissions', 'poll', 'self', 't']
})
@Component({
  selector: 'rtk-poll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'permissions', 'poll', 'self', 't'],
})
export class RtkPoll {
  protected el: HTMLRtkPollElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkVotePoll']);
  }
}


export declare interface RtkPoll extends Components.RtkPoll {
  /**
   * Event which is emitted when a poll is voted on
   */
  rtkVotePoll: EventEmitter<CustomEvent<{ id: string; index: number; }>>;
}


@ProxyCmp({
  inputs: ['iconPack', 't']
})
@Component({
  selector: 'rtk-poll-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 't'],
})
export class RtkPollForm {
  protected el: HTMLRtkPollFormElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkCreatePoll']);
  }
}


import type { PollObject as IRtkPollFormPollObject } from '@cloudflare/realtimekit-ui';

export declare interface RtkPollForm extends Components.RtkPollForm {
  /**
   * Event which is emitted when a poll is created
   */
  rtkCreatePoll: EventEmitter<CustomEvent<IRtkPollFormPollObject>>;
}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-polls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 't'],
})
export class RtkPolls {
  protected el: HTMLRtkPollsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkPolls extends Components.RtkPolls {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-polls-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkPollsToggle {
  protected el: HTMLRtkPollsToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkPollsToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkPollsToggle extends Components.RtkPollsToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkPollsToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-recording-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't'],
})
export class RtkRecordingIndicator {
  protected el: HTMLRtkRecordingIndicatorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkRecordingIndicator extends Components.RtkRecordingIndicator {}


@ProxyCmp({
  inputs: ['disabled', 'iconPack', 'meeting', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-recording-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'iconPack', 'meeting', 'size', 't', 'variant'],
})
export class RtkRecordingToggle {
  protected el: HTMLRtkRecordingToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkApiError']);
  }
}


export declare interface RtkRecordingToggle extends Components.RtkRecordingToggle {
  /**
   * Emit api error events
   */
  rtkApiError: EventEmitter<CustomEvent<{ trace: string; message: string; }>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-screen-share-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkScreenShareToggle {
  protected el: HTMLRtkScreenShareToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate', 'rtkApiError']);
  }
}


import type { States as IRtkScreenShareToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkScreenShareToggle extends Components.RtkScreenShareToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkScreenShareToggleStates>>;
  /**
   * Emit api error events
   */
  rtkApiError: EventEmitter<CustomEvent<{ trace: string; message: string; }>>;
}


@ProxyCmp({
  inputs: ['hideFullScreenButton', 'iconPack', 'meeting', 'nameTagPosition', 'participant', 'size', 't', 'variant']
})
@Component({
  selector: 'rtk-screenshare-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['hideFullScreenButton', 'iconPack', 'meeting', 'nameTagPosition', 'participant', 'size', 't', 'variant'],
})
export class RtkScreenshareView {
  protected el: HTMLRtkScreenshareViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate', 'screensharePlay']);
  }
}


import type { States as IRtkScreenshareViewStates } from '@cloudflare/realtimekit-ui';
import type { Peer as IRtkScreenshareViewPeer } from '@cloudflare/realtimekit-ui';

export declare interface RtkScreenshareView extends Components.RtkScreenshareView {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkScreenshareViewStates>>;
  /**
   * Emits when video playback happens successfully
   */
  screensharePlay: EventEmitter<CustomEvent<{ participant: IRtkScreenshareViewPeer; screenshareParticipant: IRtkScreenshareViewPeer; }>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkSettings {
  protected el: HTMLRtkSettingsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkSettingsStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkSettings extends Components.RtkSettings {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkSettingsStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-settings-audio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkSettingsAudio {
  protected el: HTMLRtkSettingsAudioElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkSettingsAudioStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkSettingsAudio extends Components.RtkSettingsAudio {
  /**
   * Event updated state
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkSettingsAudioStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-settings-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'size', 'states', 't', 'variant'],
})
export class RtkSettingsToggle {
  protected el: HTMLRtkSettingsToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkSettingsToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkSettingsToggle extends Components.RtkSettingsToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkSettingsToggleStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-settings-video',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkSettingsVideo {
  protected el: HTMLRtkSettingsVideoElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkSettingsVideoStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkSettingsVideo extends Components.RtkSettingsVideo {
  /**
   * Emits updated state
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkSettingsVideoStates>>;
}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-setup-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'size', 'states', 't'],
})
export class RtkSetupScreen {
  protected el: HTMLRtkSetupScreenElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkSetupScreenStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkSetupScreen extends Components.RtkSetupScreen {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkSetupScreenStates>>;
}


@ProxyCmp({
  inputs: ['config', 'defaultSection', 'enabledSections', 'iconPack', 'meeting', 'size', 'states', 't', 'view']
})
@Component({
  selector: 'rtk-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'defaultSection', 'enabledSections', 'iconPack', 'meeting', 'size', 'states', 't', 'view'],
})
export class RtkSidebar {
  protected el: HTMLRtkSidebarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkSidebarStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkSidebar extends Components.RtkSidebar {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkSidebarStates>>;
}


@ProxyCmp({
  inputs: ['currentTab', 'focusCloseButton', 'hideCloseAction', 'hideHeader', 'iconPack', 't', 'tabs', 'view']
})
@Component({
  selector: 'rtk-sidebar-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['currentTab', 'focusCloseButton', 'hideCloseAction', 'hideHeader', 'iconPack', 't', 'tabs', 'view'],
})
export class RtkSidebarUi {
  protected el: HTMLRtkSidebarUiElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['tabChange', 'sidebarClose']);
  }
}


export declare interface RtkSidebarUi extends Components.RtkSidebarUi {
  /**
   * Tab change event
   */
  tabChange: EventEmitter<CustomEvent<string>>;
  /**
   * Tab change event
   */
  sidebarClose: EventEmitter<CustomEvent<void>>;
}


@ProxyCmp({
  inputs: ['aspectRatio', 'config', 'gap', 'iconPack', 'meeting', 'participants', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-simple-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['aspectRatio', 'config', 'gap', 'iconPack', 'meeting', 'participants', 'size', 'states', 't'],
})
export class RtkSimpleGrid {
  protected el: HTMLRtkSimpleGridElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkSimpleGrid extends Components.RtkSimpleGrid {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-speaker-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkSpeakerSelector {
  protected el: HTMLRtkSpeakerSelectorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkSpeakerSelector extends Components.RtkSpeakerSelector {}


@ProxyCmp({
  inputs: ['iconPack', 'size']
})
@Component({
  selector: 'rtk-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'size'],
})
export class RtkSpinner {
  protected el: HTMLRtkSpinnerElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkSpinner extends Components.RtkSpinner {}


@ProxyCmp({
  inputs: ['aspectRatio', 'config', 'gap', 'gridSize', 'iconPack', 'layout', 'meeting', 'participants', 'pinnedParticipants', 'size', 'states', 't']
})
@Component({
  selector: 'rtk-spotlight-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['aspectRatio', 'config', 'gap', 'gridSize', 'iconPack', 'layout', 'meeting', 'participants', 'pinnedParticipants', 'size', 'states', 't'],
})
export class RtkSpotlightGrid {
  protected el: HTMLRtkSpotlightGridElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkSpotlightGrid extends Components.RtkSpotlightGrid {}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 't']
})
@Component({
  selector: 'rtk-spotlight-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 't'],
})
export class RtkSpotlightIndicator {
  protected el: HTMLRtkSpotlightIndicatorElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkSpotlightIndicator extends Components.RtkSpotlightIndicator {}


@ProxyCmp({
  inputs: ['iconPack', 't']
})
@Component({
  selector: 'rtk-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 't'],
})
export class RtkStage {
  protected el: HTMLRtkStageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkStageStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkStage extends Components.RtkStage {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkStageStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant']
})
@Component({
  selector: 'rtk-stage-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 'size', 'states', 't', 'variant'],
})
export class RtkStageToggle {
  protected el: HTMLRtkStageToggleElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStateUpdate']);
  }
}


import type { States as IRtkStageToggleStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkStageToggle extends Components.RtkStageToggle {
  /**
   * Emits updated state data
   */
  rtkStateUpdate: EventEmitter<CustomEvent<IRtkStageToggleStates>>;
}


@ProxyCmp({
  inputs: ['checked', 'disabled', 'iconPack', 'readonly', 't']
})
@Component({
  selector: 'rtk-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['checked', 'disabled', 'iconPack', 'readonly', 't'],
})
export class RtkSwitch {
  protected el: HTMLRtkSwitchElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkChange']);
  }
}


export declare interface RtkSwitch extends Components.RtkSwitch {
  /**
   * Event when switch value is changed
   */
  rtkChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['activeTab', 'config', 'iconPack', 'layout', 'meeting', 'size', 'states', 't', 'tabs']
})
@Component({
  selector: 'rtk-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['activeTab', 'config', 'iconPack', 'layout', 'meeting', 'size', 'states', 't', 'tabs'],
})
export class RtkTabBar {
  protected el: HTMLRtkTabBarElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['tabChange']);
  }
}


import type { Tab as IRtkTabBarTab } from '@cloudflare/realtimekit-ui';

export declare interface RtkTabBar extends Components.RtkTabBar {
  /**
   * Set active tab
   */
  tabChange: EventEmitter<CustomEvent<IRtkTabBarTab>>;
}


@ProxyCmp({
  inputs: ['disabled', 'iconPack', 'keyDownHandler', 'maxLength', 'placeholder', 'rateLimitBreached', 't', 'value'],
  methods: ['setText']
})
@Component({
  selector: 'rtk-text-composer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['disabled', 'iconPack', 'keyDownHandler', 'maxLength', 'placeholder', 'rateLimitBreached', 't', 'value'],
})
export class RtkTextComposerView {
  protected el: HTMLRtkTextComposerViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['textChange']);
  }
}


export declare interface RtkTextComposerView extends Components.RtkTextComposerView {
  /**
   * Event emitted when text changes
   */
  textChange: EventEmitter<CustomEvent<string>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'isContinued', 'message', 'now', 'showBubble', 't']
})
@Component({
  selector: 'rtk-text-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'isContinued', 'message', 'now', 'showBubble', 't'],
})
export class RtkTextMessage {
  protected el: HTMLRtkTextMessageElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkTextMessage extends Components.RtkTextMessage {}


@ProxyCmp({
  inputs: ['isMarkdown', 'text']
})
@Component({
  selector: 'rtk-text-message-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['isMarkdown', 'text'],
})
export class RtkTextMessageView {
  protected el: HTMLRtkTextMessageViewElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkTextMessageView extends Components.RtkTextMessageView {}


@ProxyCmp({
  inputs: ['delay', 'disabled', 'kind', 'label', 'open', 'placement', 'size', 'variant']
})
@Component({
  selector: 'rtk-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['delay', 'disabled', 'kind', 'label', 'open', 'placement', 'size', 'variant'],
})
export class RtkTooltip {
  protected el: HTMLRtkTooltipElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkOpenChange']);
  }
}


export declare interface RtkTooltip extends Components.RtkTooltip {
  /**
   * Event handler called when the open state of the tooltip changes.
   */
  rtkOpenChange: EventEmitter<CustomEvent<boolean>>;
}


@ProxyCmp({
  inputs: ['t', 'transcript']
})
@Component({
  selector: 'rtk-transcript',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['t', 'transcript'],
})
export class RtkTranscript {
  protected el: HTMLRtkTranscriptElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkTranscriptDismiss']);
  }
}


export declare interface RtkTranscript extends Components.RtkTranscript {
  /**
   * Dismiss event
   */
  rtkTranscriptDismiss: EventEmitter<CustomEvent<{ id: string; renderedId: string; }>>;
}


@ProxyCmp({
  inputs: ['config', 'meeting', 'states', 't']
})
@Component({
  selector: 'rtk-transcripts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'meeting', 'states', 't'],
})
export class RtkTranscripts {
  protected el: HTMLRtkTranscriptsElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkTranscripts extends Components.RtkTranscripts {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 'mode', 'showSetupScreen', 't']
})
@Component({
  selector: 'rtk-ui-provider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 'mode', 'showSetupScreen', 't'],
})
export class RtkUiProvider {
  protected el: HTMLRtkUiProviderElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['rtkStatesUpdate']);
  }
}


import type { States as IRtkUiProviderStates } from '@cloudflare/realtimekit-ui';

export declare interface RtkUiProvider extends Components.RtkUiProvider {
  /**
   * Emits `rtkStatesUpdate` so that developers can listen to onRtkStatesUpdate and update their own stores
Do not confuse this with `rtkStateUpdate` that other components emit
   */
  rtkStatesUpdate: EventEmitter<CustomEvent<IRtkUiProviderStates>>;
}


@ProxyCmp({
  inputs: ['iconPack', 'meeting', 't', 'variant']
})
@Component({
  selector: 'rtk-viewer-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['iconPack', 'meeting', 't', 'variant'],
})
export class RtkViewerCount {
  protected el: HTMLRtkViewerCountElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkViewerCount extends Components.RtkViewerCount {}


@ProxyCmp({
  inputs: ['bufferedItemsCount', 'emptyListElement', 'itemHeight', 'items', 'renderItem']
})
@Component({
  selector: 'rtk-virtualized-participant-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['bufferedItemsCount', 'emptyListElement', 'itemHeight', 'items', 'renderItem'],
})
export class RtkVirtualizedParticipantList {
  protected el: HTMLRtkVirtualizedParticipantListElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkVirtualizedParticipantList extends Components.RtkVirtualizedParticipantList {}


@ProxyCmp({
  inputs: ['config', 'iconPack', 'meeting', 't']
})
@Component({
  selector: 'rtk-waiting-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['config', 'iconPack', 'meeting', 't'],
})
export class RtkWaitingScreen {
  protected el: HTMLRtkWaitingScreenElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface RtkWaitingScreen extends Components.RtkWaitingScreen {}


