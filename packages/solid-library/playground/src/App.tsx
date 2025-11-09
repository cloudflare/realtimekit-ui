import RtkLeaveButton from '../../src/components/rtk-leave-button';

export default function App() {
  const fakeMeeting = {
    self: {},
    stage: {},
    meta: {},
  };

  return (
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 class="text-2xl font-bold">RtkLeaveButtonProps Test</h1>
      <RtkLeaveButton onLeave={() => console.log('Leave confirmation triggered')} />{' '}
    </div>
  );
}
