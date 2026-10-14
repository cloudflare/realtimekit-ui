import { ConnectedMeetingState } from '../types/props';
import { participantIdentifier } from './breakout-rooms';
import BreakoutRoomsManager from './breakout-rooms-manager';
import RealtimeKitClient from '@cloudflare/realtimekit';

const RealtimeKitClientMock = jest.fn().mockImplementation(() => ({
  connectedMeetings: {
    createMeetings: jest.fn().mockImplementation((meetingsToCreate: { title: string }[]) =>
      meetingsToCreate.map((meeting, index) => ({
        id: `Room_id_${index + 11}`,
        title: meeting.title,
      }))
    ),
    updateMeetings: jest.fn(),
    deleteMeetings: jest.fn(),
    moveParticipants: jest.fn(),
  },
}));

const MOCK_PARTICIPANT_1 = {
  id: 'participant_111',
  customParticipantId: 'participant_111_custom',
  presetId: 'participant_111_preset',
  displayPictureUrl: 'image_url',
};
const MOCK_PARTICIPANT_2 = {
  id: 'participant_222',
  customParticipantId: 'participant_222_custom',
  presetId: 'participant_222_preset',
  displayPictureUrl: 'image_url',
};
const MOCK_PARTICIPANT_3 = {
  id: 'participant_333',
  customParticipantId: 'participant_333_custom',
  presetId: 'participant_333_preset',
  displayPictureUrl: 'image_url',
};
const MOCK_PARTICIPANT_4 = {
  id: 'participant_444',
  customParticipantId: 'participant_444_custom',
  presetId: 'participant_444_preset',
  displayPictureUrl: 'image_url',
};
const MOCK_PARTICIPANT_5 = {
  id: 'participant_555',
  customParticipantId: 'participant_555_custom',
  presetId: 'participant_555_preset',
  displayPictureUrl: 'image_url',
};

const MOCK_ROOM_1 = {
  id: 'room_id_1',
  title: 'Room 1',
};
const MOCK_ROOM_2 = {
  id: 'room_id_2',
  title: 'Room 2',
};
const MOCK_ROOM_3 = {
  id: 'room_id_3',
  title: 'Room 3',
};

const MOCK_STATE: ConnectedMeetingState = {
  parentMeeting: {
    id: 'parent_id_123',
    title: 'Breakout rooms test',
    participants: [
      MOCK_PARTICIPANT_1,
      MOCK_PARTICIPANT_2,
      MOCK_PARTICIPANT_3,
      MOCK_PARTICIPANT_4,
      MOCK_PARTICIPANT_5,
    ],
  },
  meetings: [],
};
const MOCK_STATE_LIVE: ConnectedMeetingState = {
  parentMeeting: {
    id: 'parent_id_123',
    title: 'Breakout rooms test',
    participants: [],
  },
  meetings: [
    {
      ...MOCK_ROOM_1,
      participants: [MOCK_PARTICIPANT_1, MOCK_PARTICIPANT_2],
    },
    {
      ...MOCK_ROOM_2,
      participants: [MOCK_PARTICIPANT_3, MOCK_PARTICIPANT_4],
    },
    {
      ...MOCK_ROOM_3,
      participants: [MOCK_PARTICIPANT_5],
    },
  ],
};

describe('Breakout rooms manager', () => {
  it('should initialize state', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);

    expect(manager.currentState).toHaveProperty('parentMeeting');
    expect(manager.currentState).toHaveProperty('meetings');
    expect(manager.currentState.parentMeeting.participants).toHaveLength(
      MOCK_STATE.parentMeeting.participants.length
    );
    expect(manager.currentState.meetings).toHaveLength(MOCK_STATE.meetings.length);
  });

  it('should update current state with new state provided', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    manager.updateCurrentState(MOCK_STATE_LIVE);
    expect(manager.currentState.parentMeeting.participants).toHaveLength(
      MOCK_STATE_LIVE.parentMeeting.participants.length
    );
    expect(manager.currentState.meetings).toHaveLength(MOCK_STATE_LIVE.meetings.length);
  });

  it('should only add new participants and meeting to state if it has local changes', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    // add rooms
    manager.addNewMeetings(2);
    const [connectedMeeting] = manager.allConnectedMeetings;
    expect(manager.allConnectedMeetings).toHaveLength(2);

    // move 2 participants to first room
    manager.assignParticipantsToMeeting(
      [MOCK_PARTICIPANT_1.customParticipantId, MOCK_PARTICIPANT_2.customParticipantId],
      connectedMeeting.id
    );
    expect(manager.getParticipantsForMeeting(connectedMeeting.id)).toHaveLength(2);

    // update state with 1 new room and participant
    manager.updateCurrentState({
      parentMeeting: MOCK_STATE.parentMeeting,
      meetings: [
        {
          id: 'new_meeting',
          title: 'New meeting title',
          participants: [
            {
              id: 'new_p_id',
              customParticipantId: 'new_p_id',
              presetId: 'participant',
              displayName: 'Newbie',
              displayPictureUrl: '',
            },
          ],
        },
      ],
    });
    expect(manager.allConnectedMeetings).toHaveLength(3);
    expect(manager.allParticipants).toHaveLength(MOCK_STATE.parentMeeting.participants.length + 1);
  });

  it('should reset local state on discard', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    // add rooms
    manager.addNewMeetings(2);
    const [connectedMeeting] = manager.allConnectedMeetings;
    expect(manager.allConnectedMeetings).toHaveLength(2);

    // move 2 participants to first room
    manager.assignParticipantsToMeeting(
      [MOCK_PARTICIPANT_1.customParticipantId, MOCK_PARTICIPANT_2.customParticipantId],
      connectedMeeting.id
    );
    expect(manager.getParticipantsForMeeting(connectedMeeting.id)).toHaveLength(2);

    manager.discardChanges();
    expect(manager.currentState).toMatchObject(MOCK_STATE);
  });

  it('should update title', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    // add rooms
    manager.addNewMeetings(1);
    const [connectedMeeting] = manager.allConnectedMeetings;
    expect(manager.allConnectedMeetings).toHaveLength(1);

    const updatedTitle = 'Updated title';
    manager.updateMeetingTitle(connectedMeeting.id, updatedTitle);
    const [updatedConnectedMeeting] = manager.allConnectedMeetings;
    expect(updatedConnectedMeeting.title).toEqual(updatedTitle);
  });

  it('should flag a title change of an existing meeting as a local change', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE_LIVE);
    expect(manager.hasLocalChanges).toBe(false);

    manager.updateMeetingTitle(MOCK_ROOM_1.id, 'Renamed room');
    expect(manager.hasLocalChanges).toBe(true);
    expect(manager.meetingsToUpdate).toEqual([{ id: MOCK_ROOM_1.id, title: 'Renamed room' }]);

    // a state update from the server must not discard the pending rename
    manager.updateCurrentState(MOCK_STATE_LIVE);
    expect(manager.meetingsToUpdate).toEqual([{ id: MOCK_ROOM_1.id, title: 'Renamed room' }]);
  });

  it('should shuffle assign participants', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    manager.addNewMeetings(3);
    manager.assignParticipantsRandomly();
    expect(manager.currentState.parentMeeting.participants).toHaveLength(0);
    expect(manager.allConnectedMeetings.flatMap((meeting) => meeting.participants)).toHaveLength(
      MOCK_STATE.parentMeeting.participants.length
    );
  });

  it('should unassign single participant', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    manager.addNewMeetings(1);
    manager.assignParticipantsRandomly();
    expect(manager.currentState.parentMeeting.participants).toHaveLength(0);

    manager.unassignParticipants([MOCK_PARTICIPANT_1.customParticipantId]);
    expect(manager.currentState.parentMeeting.participants).toHaveLength(1);
  });

  it('should unassign all participant', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    manager.addNewMeetings(2);
    manager.assignParticipantsRandomly();

    manager.unassignAllParticipants();
    expect(manager.currentState.parentMeeting.participants).toHaveLength(
      MOCK_STATE.parentMeeting.participants.length
    );
  });

  it('should keep a flag for local changes', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    expect(manager.hasLocalChanges).toEqual(false);
    manager.addNewMeetings(2);
    expect(manager.hasLocalChanges).toEqual(true);
    manager.discardChanges();
    expect(manager.hasLocalChanges).toEqual(false);
  });

  it('should delete draft meeting', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE);
    manager.addNewMeeting();
    const [connectedMeeting] = manager.allConnectedMeetings;
    manager.deleteMeeting(connectedMeeting.id);
    expect(manager.allConnectedMeetings).toHaveLength(0);
  });

  it('should delete connected meeting and move participants to parent meeting', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE_LIVE);
    const [connectedMeeting] = manager.allConnectedMeetings;
    manager.deleteMeeting(connectedMeeting.id);

    expect(manager.currentState.parentMeeting.participants).toHaveLength(
      connectedMeeting.participants.length
    );

    expect(manager.meetingsToDelete).toHaveLength(1);
    expect(manager.meetingsToDelete).toEqual([connectedMeeting.id]);
    expect(manager.participantsToMove).toMatchObject([
      {
        participantIds: connectedMeeting.participants.map((p) => p.id),
        destinationMeetingId: manager.currentState.parentMeeting.id,
        sourceMeetingId: connectedMeeting.id,
      },
    ]);
  });

  it('should output draft changes to apply', () => {
    const manager = new BreakoutRoomsManager();
    manager.updateCurrentState(MOCK_STATE_LIVE);
    const [connectedMeeting1, connectedMeeting2] = manager.allConnectedMeetings;

    // create two new meeting
    const [newMeeting1, newMeeting2] = manager.addNewMeetings(2);
    // delete one of the new
    manager.deleteMeeting(newMeeting2.id);
    // delete an old meeting
    manager.deleteMeeting(connectedMeeting2.id);
    // update title of the new meeting
    const newMeetingTitle = 'New Meeting';
    manager.updateMeetingTitle(newMeeting1.id, newMeetingTitle);
    // update title of an old meeting
    const updatedMeetingTitle = 'Updated title';
    manager.updateMeetingTitle(connectedMeeting1.id, updatedMeetingTitle);

    manager.assignParticipantsToMeeting(
      MOCK_STATE_LIVE.meetings[1].participants.map(participantIdentifier),
      connectedMeeting1.id
    );

    expect(manager.meetingsToCreate).toMatchObject([{ title: newMeetingTitle }]);
    expect(manager.meetingsToUpdate).toMatchObject([
      { id: connectedMeeting1.id, title: updatedMeetingTitle },
    ]);
    expect(manager.meetingsToDelete).toMatchObject([connectedMeeting2.id]);
    expect(manager.participantsToMove).toMatchObject([
      {
        participantIds: connectedMeeting2.participants.map((p) => p.id),
        destinationMeetingId: connectedMeeting1.id,
        sourceMeetingId: connectedMeeting2.id,
      },
    ]);
  });

  it('should apply changes', async () => {
    const manager = new BreakoutRoomsManager();

    manager.updateCurrentState(MOCK_STATE_LIVE);

    // add new meeting
    const newMeeting = manager.addNewMeeting();
    // update title of new meeting
    const newMeetingTitle = 'New meeting title';
    manager.updateMeetingTitle(newMeeting.id, newMeetingTitle);
    // update title of existing meeting
    const updatedTitle = 'Updated Title';
    manager.updateMeetingTitle(MOCK_ROOM_2.id, updatedTitle);
    // move participants
    manager.assignParticipantsToMeeting([MOCK_PARTICIPANT_1.customParticipantId], newMeeting.id);
    // delete a existing meeting
    manager.deleteMeeting(MOCK_ROOM_3.id);

    const client: RealtimeKitClient = new RealtimeKitClientMock();
    await manager.applyChanges(client);

    expect(client.connectedMeetings.createMeetings).toHaveBeenCalledWith([
      { id: newMeeting.id, title: newMeetingTitle },
    ]);
    expect(client.connectedMeetings.updateMeetings).toHaveBeenCalledWith([
      { id: MOCK_ROOM_2.id, title: updatedTitle },
    ]);
    expect(client.connectedMeetings.moveParticipants).toHaveBeenCalledTimes(2);
    const newConnectedMeeting = manager.allConnectedMeetings.find(
      (meeting) => meeting.title === newMeetingTitle
    );

    expect(client.connectedMeetings.moveParticipants).toHaveBeenNthCalledWith(
      1,
      MOCK_ROOM_1.id,
      newConnectedMeeting.id,
      [MOCK_PARTICIPANT_1.id]
    );
    expect(client.connectedMeetings.moveParticipants).toHaveBeenNthCalledWith(
      2,
      MOCK_ROOM_3.id,
      MOCK_STATE_LIVE.parentMeeting.id,
      [MOCK_PARTICIPANT_5.id]
    );
    expect(client.connectedMeetings.deleteMeetings).toHaveBeenCalledWith([MOCK_ROOM_3.id]);
  });
});
