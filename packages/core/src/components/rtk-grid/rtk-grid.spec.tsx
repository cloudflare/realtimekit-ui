import { RtkGrid } from './rtk-grid';

describe('<rtk-grid>', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('refreshes participant arrays after the active map commits a snapshot update', () => {
    const grid = new RtkGrid();
    const updateActiveParticipants = jest
      .spyOn(grid as any, 'updateActiveParticipants')
      .mockImplementation();

    (grid as any).onParticipantsUpdate();
    expect(updateActiveParticipants).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(updateActiveParticipants).toHaveBeenCalledTimes(1);
  });
});
