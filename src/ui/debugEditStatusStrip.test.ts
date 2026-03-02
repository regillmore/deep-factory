import { describe, expect, it } from 'vitest';

import {
  applySummaryChipStyles,
  buildWrappedDetailLines,
  resolveActionRowShouldStack,
  splitSummaryChipText
} from './debugEditStatusStrip';

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

  it('preserves multiline hint rows while splitting shortcut segments at pipe separators', () => {
    expect(
      buildWrappedDetailLines(
        'Touch: drag to paint | pinch zoom\n' +
          'Desktop: left paint | right break | Shift-drag pan | wheel zoom | Pin Click arms inspect pinning'
      )
    ).toEqual([
      ['Touch: drag to paint', '| pinch zoom'],
      [
        'Desktop: left paint',
        '| right break',
        '| Shift-drag pan',
        '| wheel zoom',
        '| Pin Click arms inspect pinning'
      ]
    ]);
  });

  it('splits empty-hover guidance into wrap-friendly action segments', () => {
    expect(
      buildWrappedDetailLines(
        'Hover: move cursor | touch a world tile | inspect gameplay flags | Pin Click keeps metadata visible'
      )
    ).toEqual([
      [
        'Hover: move cursor',
        '| touch a world tile',
        '| inspect gameplay flags',
        '| Pin Click keeps metadata visible'
      ]
    ]);
  });

  it('splits respawn event text into wrap-friendly telemetry segments', () => {
    expect(
      buildWrappedDetailLines('Respawn: embedded | spawn 3,-2 | pos 56.00,-32.00 | vel 0.00,0.00')
    ).toEqual([['Respawn: embedded', '| spawn 3,-2', '| pos 56.00,-32.00', '| vel 0.00,0.00']]);
  });

  it('preserves separate respawn and wall-contact event lines while splitting each line at pipe separators', () => {
    expect(
      buildWrappedDetailLines(
        'Respawn: embedded | spawn 3,-2 | pos 56.00,-32.00 | vel 0.00,0.00\n' +
          'Wall: blocked | tile 5,-3 (#7) | pos 88.00,-24.00 | vel -180.00,60.00'
      )
    ).toEqual([
      ['Respawn: embedded', '| spawn 3,-2', '| pos 56.00,-32.00', '| vel 0.00,0.00'],
      ['Wall: blocked', '| tile 5,-3 (#7)', '| pos 88.00,-24.00', '| vel -180.00,60.00']
    ]);
  });
});

describe('splitSummaryChipText', () => {
  it('separates the fixed chip label from the wrap-friendly detail text', () => {
    expect(splitSummaryChipText('Brush: polished obsidian brick (#12)')).toEqual({
      label: 'Brush:',
      detail: 'polished obsidian brick (#12)'
    });
  });

  it('keeps the full text as the label when no label separator is present', () => {
    expect(splitSummaryChipText('Hover only')).toEqual({
      label: 'Hover only',
      detail: null
    });
  });
});

describe('applySummaryChipStyles', () => {
  it('uses wrap-friendly chip styles instead of nowrap ellipsis truncation', () => {
    const chip = {
      style: {} as Record<string, string | undefined>
    };

    applySummaryChipStyles(chip);

    expect(chip.style.display).toBe('inline-flex');
    expect(chip.style.flex).toBe('0 1 auto');
    expect(chip.style.flexWrap).toBe('wrap');
    expect(chip.style.minWidth).toBe('0');
    expect(chip.style.maxWidth).toBe('100%');
    expect(chip.style.overflowWrap).toBe('anywhere');
    expect(chip.style.textOverflow).toBe('clip');
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
