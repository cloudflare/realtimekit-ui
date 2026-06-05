import { Meeting } from '../types/rtk-client';

let roomCount = 0;

export function getNextRoomNumber() {
  return ++roomCount;
}

export function resetRoomCount() {
  roomCount = 0;
}

export const TEMP_ROOM_PREFIX = 'temp-';

export function createDraftRoom() {
  return {
    id: `${TEMP_ROOM_PREFIX}${Math.random().toString(36)}`,
    title: `Room ${getNextRoomNumber()}`,
    participants: [],
  };
}

export function createDraftRooms(numberOfRooms: number) {
  return Array.from({ length: numberOfRooms }).map(createDraftRoom);
}

export function isDraftRoom(roomId: string) {
  return roomId.includes(TEMP_ROOM_PREFIX);
}

export function splitCollection<T>(collection: T[], parts: number) {
  const length = collection.length;
  const size = Math.ceil(length / parts);
  const result = new Array<T[]>(parts);
  let start = 0;

  for (let i = 0; i < parts; i++) {
    result[i] = collection.slice(start, start + size);
    start += size;
  }
  return result.filter((res) => res.length);
}

export function participantIdentifier(participant) {
  return participant.customParticipantId ?? participant.clientSpecificId;
}

export function getAllConnectedParticipants(meeting: Meeting) {
  // TODO: remove this once we start getting display pics from socket
  const map = new Map<string, string>();
  [meeting.self, ...meeting.participants.joined.toArray()].map((participant) => {
    map.set(participantIdentifier(participant), participant.picture);
  });
  return [meeting.connectedMeetings.parentMeeting, ...meeting.connectedMeetings.meetings]
    .flatMap((meeting) => meeting.participants)
    .map((connectedPeer) => {
      return {
        id: connectedPeer.id,
        customParticipantId: participantIdentifier(connectedPeer),
        displayName: connectedPeer.displayName,
        displayPictureUrl:
          connectedPeer.displayPictureUrl !== ''
            ? connectedPeer.displayPictureUrl
            : map.get(participantIdentifier(connectedPeer)),
      };
    });
}

export const canToggleBreakout = (meeting: Meeting) => {
  const permissions = meeting.self.permissions.connectedMeetings;

  // for host - always show toggle
  if (permissions.canAlterConnectedMeetings) return true;

  // for participants - show only when breakout is active
  if (permissions.canSwitchConnectedMeetings || permissions.canSwitchToParentMeeting) {
    return meeting.connectedMeetings.isActive;
  }

  return false;
};
