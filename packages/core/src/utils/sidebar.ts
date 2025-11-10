import { Meeting } from '../types/rtk-client';
import { isLiveStreamViewer } from './livestream';

export const canViewChat = (meeting: Meeting) => {
  if (meeting && !meeting.chat) return false;

  const { chatPublic, chatPrivate } = meeting.self.permissions;

  return (
    chatPublic.canSend ||
    (chatPublic as any).canReceive || // TODO(ravindra-cloudflare): add web-core equivalent of chatPublic.canReceive, remove type casting
    chatPublic.text ||
    chatPublic.files ||
    chatPrivate.canSend ||
    chatPrivate.canReceive ||
    chatPrivate.files ||
    chatPrivate.text
  );
};

export const canViewPolls = (meeting: Meeting) => {
  if (meeting && !meeting.polls) return false;

  const { polls } = meeting.self.permissions;
  return polls.canCreate || polls.canView || polls.canVote;
};

export const canViewParticipants = (meeting: Meeting) => {
  if (!meeting.self.permissions?.showParticipantList) {
    return false;
  }
  if (meeting && !meeting.participants) return false;
  const config = meeting?.self.config;
  if (config && !config.controlBar.elements.participants) return false;
  return true;
};

export const canViewPlugins = (meeting: Meeting) => {
  if (isLiveStreamViewer(meeting)) return false;
  if (meeting && !meeting.plugins) return false;
  if (meeting.meta.viewType === 'LIVESTREAM') return meeting.stage.status === 'ON_STAGE';

  const { plugins } = meeting.self.permissions;

  return plugins.canClose || plugins.canStart;
};
