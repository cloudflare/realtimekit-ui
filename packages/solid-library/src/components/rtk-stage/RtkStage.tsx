import type { JSX } from 'solid-js';

export interface RtkStageProps {
  children?: JSX.Element;
}

export default function RtkStage(props: RtkStageProps) {
  return (
    <div class="bg-base-100 border-base-300 flex h-full w-full flex-col items-center justify-center rounded-lg border p-4">
      {props.children ?? <p class="opacity-60">Empty stage</p>}
    </div>
  );
}
