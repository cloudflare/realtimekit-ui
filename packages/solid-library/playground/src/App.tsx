import RtkCameraToggle from '../../src/components/rtk-camera-toggle';

export default function App() {
  const fakeMeeting = {
    self: {},
    stage: {},
    meta: {},
  };

  return (
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 class="text-2xl font-bold">RtkCameraToggle Test</h1>

      <RtkCameraToggle meeting={fakeMeeting} />
    </div>
  );
}
