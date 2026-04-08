import { GridSize } from '../components/rtk-grid/rtk-grid';

export type Dimensions = {
  width: number;
  height: number;
};

type UseGridItemDimensionsParams = {
  count: number;
  dimensions: Dimensions;
  aspectRatio: string;
  gap: number;
};

type GridItemData = Dimensions & { rows: number; cols: number };

function roundDown(num: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.floor(num * factor) / factor;
}

export function useGrid({ dimensions, count, aspectRatio, gap }: UseGridItemDimensionsParams) {
  const { width, height, rows, cols } = useGridItemDimensions({
    dimensions,
    count,
    aspectRatio,
    gap,
  });

  const getPosition = useGridPositioning({
    parentDimensions: dimensions,
    dimensions: { width, height },
    rows,
    cols,
    count,
    gap,
  });

  return { width, height, getPosition };
}

export function useGridItemDimensions({
  count,
  dimensions,
  aspectRatio,
  gap,
}: UseGridItemDimensionsParams): GridItemData {
  let { width: W, height: H } = dimensions;

  if (W === 0 || H === 0) return { width: 0, height: 0, rows: 1, cols: 1 };

  W -= gap * 2;
  H -= gap * 2;

  const s = gap,
    N = count;
  const r = getAspectRatio(aspectRatio);

  let w = 0,
    h = 0;
  let a = 1,
    b = 1;

  const widths = [];

  for (let n = 1; n <= N; n++) {
    widths.push((W - s * (n - 1)) / n);
    widths.push((H - s * (n - 1)) / (n * r));
  }

  // sort in descending order, largest first
  widths.sort((a, b) => b - a);

  for (const width of widths) {
    // We fix the precision to 4 decimal places to prevent
    // floating point overflow errors. Anyway, accuracy above
    // 4 decimal places does not really matter.
    w = roundDown(width, 4);
    h = roundDown(w * r, 4);

    a = Math.floor((W + s) / (w + s));
    b = Math.floor((H + s) / (h + s));

    if (a * b >= N) {
      // recalculate rows, as row calculated above can be inaccurate
      b = Math.ceil(N / a);
      break;
    }
  }

  return { width: w, height: h, rows: b, cols: a };
}

export function useGridPositioning({
  parentDimensions,
  dimensions,
  rows,
  cols,
  count,
  gap,
}: {
  parentDimensions: Dimensions;
  dimensions: Dimensions;
  rows: number;
  cols: number;
  count: number;
  gap: number;
}) {
  const { width: W, height: H } = parentDimensions;
  const { width: w, height: h } = dimensions;

  const firstTop = (H - (h * rows + (rows - 1) * gap)) / 2;
  let firstLeft = (W - (w * cols + (cols - 1) * gap)) / 2;

  const topAdd = h + gap;
  const leftAdd = w + gap;

  let col = 0,
    row = 0;

  const incompleteRowCols = count % cols;

  function getPosition(index: number) {
    const remaining = count - index;

    if (remaining === incompleteRowCols) {
      // in last row with incomplete columns, recalculate firstLeft to make it centered
      firstLeft = (W - (w * remaining + (remaining - 1) * gap)) / 2;
    }

    const top = firstTop + row * topAdd;
    const left = firstLeft + col * leftAdd;

    col++;

    if ((index + 1) % cols === 0) {
      // if a row has been traversed completely, increment row, reset col
      row++;
      col = 0;
    }

    return { top, left };
  }

  return getPosition;
}

/**
 * Parses the Aspect Ratio value
 * @param ratio The aspect ratio in the format of `16:9` where `width:height`
 * @returns The parsed value of aspect ratio
 */
export const getAspectRatio = (ratio: string): number => {
  const [width, height] = (ratio || '16:9').split(':');
  return Number.parseInt(height) / Number.parseInt(width);
};

export const defaultGridSize: GridSize = {
  spotlight: 'sm',
  mixed: 'sm',
};
