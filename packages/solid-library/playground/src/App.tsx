import RtkMicToggle from '../../src/components/rtk-mic-toggle';
import { createSignal } from 'solid-js';

export default function App() {
  const [enabled, setEnabled] = createSignal(false);

  const fakeMeeting = {
    self: {
      audioEnabled: enabled(),
      enableAudio: () => setEnabled(true),
      disableAudio: () => setEnabled(false),
      permissions: { canProduceAudio: 'ALLOWED' },
    },
    stage: { status: 'ON_STAGE' },
  };

  return (
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 class="text-2xl font-bold">RtkMicToggle Test</h1>

      <RtkMicToggle
        meeting={fakeMeeting}
        size="md"
        color="primary"
        variant="filled"
        t={(key) => key}
        onStateUpdate={(state) => console.log('State update:', state)}
      />
    </div>
  );
}
