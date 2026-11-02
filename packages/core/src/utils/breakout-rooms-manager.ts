import { Meeting } from '../types/rtk-client';
import { ConnectedMeetingParticipant } from '../types/props';
import { ConnectedMeetingState } from '../types/props';
import {
  createDraftRoom,
  isDraftRoom,
  participantIdentifier,
  splitCollection,
} from './breakout-rooms';

export type DraftMeeting = {
  id: string;
  title: string;
  participants: ConnectedMeetingParticipant[];
  isParent: boolean;
};

type MeetingDetails = Omit<DraftMeeting, 'participants'>;

export default class BreakoutRoomsManager {
  #hasLocalChanges: boolean = false;

  #state: ConnectedMeetingState;

  #participantsNewMeetingMap: Map<string, string>;

  #participantsOldMeetingMap: Map<string, string>;

  #meetingParticipantsMap: Map<string, Set<string>>;

  #allParticipantsMap: Map<string, ConnectedMeetingParticipant>;

  #allMeetingsMap: Map<string, MeetingDetails>;

  #meetingsToUpdate: Set<string>;

  #meetingsToDelete: Set<string>;

  #init(state: ConnectedMeetingState) {
    this.#state = state;
    this.#allMeetingsMap = new Map();
    this.#allParticipantsMap = new Map();
    this.#meetingsToUpdate = new Set();
    this.#meetingsToDelete = new Set();
    this.#meetingParticipantsMap = new Map();
    this.#participantsNewMeetingMap = new Map();
    this.#participantsOldMeetingMap = new Map();

    this.#participantsOldMeetingMap = new Map<string, string>();
    this.#state.parentMeeting.participants.forEach((participant) => {
      this.#participantsOldMeetingMap.set(
        participantIdentifier(participant),
        this.#state.parentMeeting.id
      );
    });
    this.#state.meetings.forEach((meeting) => {
      meeting.participants.forEach((participant) => {
        this.#participantsOldMeetingMap.set(participantIdentifier(participant), meeting.id);
      });
    });
  }

  #addNewMeetingToState(meeting: MeetingDetails) {
    if (!this.#allMeetingsMap.has(meeting.id)) {
      this.#allMeetingsMap.set(meeting.id, meeting);
      this.#meetingParticipantsMap.set(meeting.id, new Set());
    }
  }

  #addNewParticipantToState(participant: ConnectedMeetingParticipant, meeting: DraftMeeting) {
    if (this.#allParticipantsMap.has(participantIdentifier(participant))) {
      return;
    }
    this.#allParticipantsMap.set(participantIdentifier(participant), participant);
    this.#participantsNewMeetingMap.set(participantIdentifier(participant), meeting.id);
    this.#meetingParticipantsMap.get(meeting.id).add(participantIdentifier(participant));
  }

  #replaceDraftMeetingIds(draftMeeting: MeetingDetails, realId: string) {
    const draftId = draftMeeting.id;
    this.#addNewMeetingToState({ ...draftMeeting, id: realId });
    this.#allMeetingsMap.delete(draftId);
    const participantSet = this.#meetingParticipantsMap.get(draftId);

    this.#meetingParticipantsMap.set(realId, participantSet);
    this.#meetingParticipantsMap.delete(draftId);

    Array.from(this.#participantsNewMeetingMap.keys()).forEach((participantId) => {
      if (this.#participantsNewMeetingMap.get(participantId) === draftId) {
        this.#participantsNewMeetingMap.set(participantId, realId);
      }
    });
  }

  #getMeetingParticipants(meetingId: string) {
    const participantIds = Array.from(this.#meetingParticipantsMap.get(meetingId));
    return participantIds.map((id) => this.#allParticipantsMap.get(id));
  }

  get hasLocalChanges() {
    return this.#hasLocalChanges;
  }

  get currentState() {
    let parentMeeting: DraftMeeting;
    let meetings: DraftMeeting[] = [];

    Array.from(this.#meetingParticipantsMap.keys()).forEach((meetingId) => {
      const meeting = this.#allMeetingsMap.get(meetingId);
      if (meeting.isParent) {
        parentMeeting = {
          ...meeting,
          participants: this.#getMeetingParticipants(meetingId),
        };
      } else {
        meetings.push({
          ...meeting,
          participants: this.#getMeetingParticipants(meetingId),
        });
      }
    });

    return {
      parentMeeting,
      meetings,
    };
  }

  get allConnectedMeetings() {
    return this.currentState.meetings.sort((a, b) => a.title.localeCompare(b.title));
  }

  get allParticipants() {
    return Array.from(this.#allParticipantsMap.values());
  }

  get unassignedParticipants() {
    return this.#getMeetingParticipants(this.#state.parentMeeting.id);
  }

  /**
   * get participants of a meeting
   */
  public getParticipantsForMeeting(meetingId: string) {
    return this.#getMeetingParticipants(meetingId);
  }

  /**
   * add a new connected meeting
   */
  public addNewMeeting() {
    this.#hasLocalChanges = true;
    const { participants, ...meeting } = createDraftRoom();
    this.#addNewMeetingToState({
      ...meeting,
      isParent: false,
    });

    return meeting;
  }

  /**
   * add multiple new connected meetings
   */
  public addNewMeetings(count: number) {
    return Array.from({ length: count }).map(() => this.addNewMeeting());
  }

  /**
   * update a meeting's title
   */
  public updateMeetingTitle(meetingId: string, newTitle: string) {
    this.#hasLocalChanges = true;
    this.#allMeetingsMap.get(meetingId).title = newTitle;
    if (!isDraftRoom(meetingId)) {
      this.#meetingsToUpdate.add(meetingId);
    }
  }

  /**
   * deleteMeeting
   */
  public deleteMeeting(meetingId: string) {
    this.#hasLocalChanges = true;
    const meeting = this.#allMeetingsMap.get(meetingId);
    const participants = this.#getMeetingParticipants(meeting.id).map(participantIdentifier);
    this.assignParticipantsToMeeting(participants, this.#state.parentMeeting.id);
    this.#allMeetingsMap.delete(meeting.id);
    this.#meetingParticipantsMap.delete(meeting.id);

    if (!isDraftRoom(meeting.id)) {
      this.#meetingsToDelete.add(meeting.id);
    }
  }

  /**
   * assign participants to a meeting
   */
  public assignParticipantsToMeeting(customParticipantIds: string[], destinationMeetingId: string) {
    this.#hasLocalChanges = true;
    customParticipantIds.forEach((participantId) => {
      const currentMeetingId = this.#participantsNewMeetingMap.get(participantId);
      this.#meetingParticipantsMap.get(currentMeetingId).delete(participantId);
      this.#meetingParticipantsMap.get(destinationMeetingId).add(participantId);
      this.#participantsNewMeetingMap.set(participantId, destinationMeetingId);
    });
    return this.currentState;
  }

  /**
   * assign participants randomly
   */
  public assignParticipantsRandomly() {
    const splits = splitCollection(this.unassignedParticipants, this.allConnectedMeetings.length);
    this.allConnectedMeetings.forEach((meeting, index) => {
      const toAssign = splits[index];
      if (toAssign && toAssign.length !== 0) {
        this.assignParticipantsToMeeting(
          toAssign.map((participant) => participant.customParticipantId),
          meeting.id
        );
      }
    });
    return this.currentState;
  }

  /**
   * unassign participants
   */
  public unassignParticipants(customParticipantIds: string[]) {
    const destinationMeetingId = this.#state.parentMeeting.id;
    return this.assignParticipantsToMeeting(customParticipantIds, destinationMeetingId);
  }

  /**
   * unassign all participants
   */
  public unassignAllParticipants() {
    const destinationMeetingId = this.#state.parentMeeting.id;
    const customParticipantIds = this.allParticipants.map(participantIdentifier);
    return this.assignParticipantsToMeeting(customParticipantIds, destinationMeetingId);
  }

  /**
   * update current state
   */
  public updateCurrentState(state: ConnectedMeetingState) {
    if (!this.#hasLocalChanges) {
      this.#init(state);
    }

    [state.parentMeeting, ...state.meetings].forEach((meeting, index) => {
      const draftMeeting = {
        ...meeting,
        isParent: index === 0,
      };

      this.#addNewMeetingToState(draftMeeting);

      meeting.participants.forEach((participant) => {
        this.#addNewParticipantToState(participant, draftMeeting);
      });
    });
  }

  get meetingsToCreate() {
    return this.allConnectedMeetings
      .filter((meeting) => isDraftRoom(meeting.id))
      .map(({ id, title }) => ({ id, title }));
  }

  get meetingsToUpdate() {
    return this.allConnectedMeetings
      .filter((meeting) => this.#meetingsToUpdate.has(meeting.id))
      .map(({ id, title }) => ({ id, title }));
  }

  get meetingsToDelete() {
    return Array.from(this.#meetingsToDelete);
  }

  get participantsToMove() {
    // gather participants
    const moveMap = new Map<string, string[]>();

    Array.from(this.#participantsNewMeetingMap.keys()).forEach((participantId) => {
      const sourceMeetingId = this.#participantsOldMeetingMap.get(participantId);
      const destinationMeetingId = this.#participantsNewMeetingMap.get(participantId);
      if (sourceMeetingId === destinationMeetingId) return;

      const key = `${sourceMeetingId}__${destinationMeetingId}`;
      if (!moveMap.has(key)) {
        moveMap.set(key, []);
      }
      const participantDetails = this.#allParticipantsMap.get(participantId);
      moveMap.get(key).push(participantDetails.id);
    });

    return Array.from(moveMap.keys()).map((key) => {
      const [sourceMeetingId, destinationMeetingId] = key.split('__');

      return {
        sourceMeetingId,
        destinationMeetingId,
        participantIds: moveMap.get(key),
      };
    });
  }

  async applyChanges(meeting: Meeting) {
    // create new rooms
    const createMeetingsPromise =
      this.meetingsToCreate.length !== 0
        ? meeting.connectedMeetings.createMeetings(this.meetingsToCreate)
        : Promise.resolve([]);

    // update old rooms titles
    const updateMeetingsPromise =
      this.meetingsToUpdate.length !== 0
        ? meeting.connectedMeetings.updateMeetings(this.meetingsToUpdate)
        : Promise.resolve();

    const [createMeetingsResponse] = await Promise.all([
      createMeetingsPromise,
      updateMeetingsPromise,
    ]);

    // replace temporary ids
    if (createMeetingsResponse) {
      createMeetingsResponse.forEach((meeting) => {
        this.meetingsToCreate.forEach((draftMeeting) => {
          if (draftMeeting.title === meeting.title) {
            this.#replaceDraftMeetingIds(this.#allMeetingsMap.get(draftMeeting.id), meeting.id);
          }
        });
      });
    }

    // move participants (no async)
    if (this.participantsToMove.length !== 0) {
      this.participantsToMove.forEach(
        ({ sourceMeetingId, destinationMeetingId, participantIds }) => {
          meeting.connectedMeetings.moveParticipants(
            sourceMeetingId,
            destinationMeetingId,
            participantIds
          );
        }
      );
    }

    // delete rooms
    if (this.meetingsToDelete.length !== 0) {
      meeting.connectedMeetings.deleteMeetings(this.meetingsToDelete);
    }
  }

  /**
   * discard local changes
   */
  public discardChanges() {
    this.#hasLocalChanges = false;
    this.updateCurrentState(this.#state);
    return this.currentState;
  }
}
