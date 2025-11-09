import { createSignal, createEffect, Show } from 'solid-js';
import { Card, Flex, Button, toastStore } from '@pathscale/ui';

export type MeetingMode = 'fixed' | 'fill';
export type MeetingState = 'setup' | 'joined' | 'ended';

export interface RtkMeetingProps {
  meeting?: Record<string, any>;
  initialState?: MeetingState;
  mode?: MeetingMode;
  onStateChange?: (state: MeetingState) => void;
}

export default function RtkMeeting(props: RtkMeetingProps) {
  const [meetingState, setMeetingState] = createSignal<MeetingState>(props.initialState ?? 'setup');
  const [mode] = createSignal<MeetingMode>(props.mode ?? 'fixed');

  createEffect(() => props.onStateChange?.(meetingState()));

  const handleJoin = () => {
    toastStore.showInfo('Joining meeting...');
    setMeetingState('joined');
    toastStore.showSuccess('Meeting joined!');
  };

  const handleLeave = () => {
    toastStore.showWarning('Leaving meeting...');
    setMeetingState('ended');
    toastStore.showInfo('Meeting ended.');
  };

  return (
    <Card
      fullWidth
      shadow="md"
      background="base-200"
      class="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 p-8"
    >
      <Show when={meetingState() === 'setup'}>
        <Flex direction="col" align="center" gap="md">
          <h2 class="text-lg font-semibold">Setup your meeting</h2>
          <p class="opacity-75">Click below to simulate joining.</p>
          <Button color="primary" onClick={handleJoin}>
            Join meeting
          </Button>
        </Flex>
      </Show>

      <Show when={meetingState() === 'joined'}>
        <Flex direction="col" align="center" gap="md">
          <h2 class="text-lg font-semibold">Meeting active</h2>
          <p class="opacity-75">Mode: {mode()}</p>
          <div class="bg-base-300 flex h-64 w-full items-center justify-center rounded-lg">
            <p class="opacity-70">Stage area (RtkStage / RtkGrid)</p>
          </div>
          <Button color="error" onClick={handleLeave}>
            Leave meeting
          </Button>
        </Flex>
      </Show>

      <Show when={meetingState() === 'ended'}>
        <Flex direction="col" align="center" gap="md">
          <h2 class="text-error text-lg font-semibold">Meeting ended</h2>
          <Button color="primary" onClick={() => setMeetingState('setup')}>
            Restart
          </Button>
        </Flex>
      </Show>
    </Card>
  );
}
