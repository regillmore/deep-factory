import { describe, expect, it } from 'vitest';

import { buildWrappedDetailLines, resolveActionRowShouldStack } from './debugEditStatusStrip';

describe('buildWrappedDetailLines', () => {
  it('splits preview text into wrap-friendly segments at pipe separators', () => {
    expect(
      buildWrappedDetailLines('Preview: anchor 4,7 | endpoint 12,-4 | span 9x12 tiles | affects 12 tiles')
    ).toEqual([
      ['Preview: anchor 4,7', '| endpoint 12,-4', '| span 9x12 tiles', '| affects 12 tiles']
    ]);
  });

  it('preserves newline-separated inspect entries while adding wrap points inside each line', () => {
    expect(
      buildWrappedDetailLines(
        'Pinned: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28 | solid:off | light:on | liquid:lava\n' +
          'Hover: dirt (#2) @ 4,7 chunk:0,0 local:4,7 | solid:on | light:on | liquid:none\n' +
          'Offset: Hover->Pinned x:+8 y:-11'
      )
    ).toEqual([
      [
        'Pinned: lava pool (#9) @ 12,-4 chunk:0,-1 local:12,28',
        '| solid:off',
        '| light:on',
        '| liquid:lava'
      ],
      ['Hover: dirt (#2) @ 4,7 chunk:0,0 local:4,7', '| solid:on', '| light:on', '| liquid:none'],
      ['Offset: Hover->Pinned x:+8 y:-11']
    ]);
  });
});

describe('resolveActionRowShouldStack', () => {
  it('keeps the inspect actions inline when the strip is wide enough for both buttons', () => {
    expect(resolveActionRowShouldStack(238, 2)).toBe(false);
  });

  it('stacks the inspect actions before two buttons would clip on narrow strips', () => {
    expect(resolveActionRowShouldStack(237, 2)).toBe(true);
  });

  it('stacks even a single action button when the strip is narrower than the button minimum width', () => {
    expect(resolveActionRowShouldStack(115, 1)).toBe(true);
  });
});
