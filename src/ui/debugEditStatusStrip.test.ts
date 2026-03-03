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

  it('keeps live player pose telemetry as a single segment when no pipe separators are present', () => {
    expect(buildWrappedDetailLines('Pose: wall-slide')).toEqual([['Pose: wall-slide']]);
  });

  it('preserves separate pose and live wall-contact player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: wall-slide\nWallNow: tile 5,-3 (#7, right)')).toEqual([
      ['Pose: wall-slide'],
      ['WallNow: tile 5,-3 (#7, right)']
    ]);
  });

  it('preserves separate pose and live support-contact player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: grounded-idle\nSupportNow: tile 4,-1 (#6)')).toEqual([
      ['Pose: grounded-idle'],
      ['SupportNow: tile 4,-1 (#6)']
    ]);
  });

  it('preserves separate pose and live grounded-state player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: grounded-idle\nGroundedNow: on')).toEqual([
      ['Pose: grounded-idle'],
      ['GroundedNow: on']
    ]);
  });

  it('preserves separate pose and live facing player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: grounded-idle\nFacingNow: right')).toEqual([
      ['Pose: grounded-idle'],
      ['FacingNow: right']
    ]);
  });

  it('preserves separate pose and live horizontal move-axis player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: grounded-walk\nMoveXNow: 1')).toEqual([
      ['Pose: grounded-walk'],
      ['MoveXNow: 1']
    ]);
  });

  it('preserves separate pose and live jump-held player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: jump-rise\nJumpHeldNow: on')).toEqual([
      ['Pose: jump-rise'],
      ['JumpHeldNow: on']
    ]);
  });

  it('preserves separate pose and live bonk-hold player lines while keeping each line individually wrappable', () => {
    expect(buildWrappedDetailLines('Pose: ceiling-bonk\nBonkHold: on')).toEqual([
      ['Pose: ceiling-bonk'],
      ['BonkHold: on']
    ]);
  });

  it('preserves separate pose, live wall-contact, and live ceiling-contact player lines while keeping each line individually wrappable', () => {
    expect(
      buildWrappedDetailLines(
        'Pose: ceiling-bonk\nWallNow: tile 5,-3 (#7, right)\nCeilingNow: tile 2,-6 (#8)'
      )
    ).toEqual([
      ['Pose: ceiling-bonk'],
      ['WallNow: tile 5,-3 (#7, right)'],
      ['CeilingNow: tile 2,-6 (#8)']
    ]);
  });

  it('preserves separate pose, live grounded-state, live support-contact, live wall-contact, and live ceiling-contact player lines while keeping each line individually wrappable', () => {
    expect(
      buildWrappedDetailLines(
        'Pose: ceiling-bonk\nGroundedNow: off\nFacingNow: left\nMoveXNow: -1\nSupportNow: tile 4,-1 (#6)\nWallNow: tile 5,-3 (#7, right)\nCeilingNow: tile 2,-6 (#8)'
      )
    ).toEqual([
      ['Pose: ceiling-bonk'],
      ['GroundedNow: off'],
      ['FacingNow: left'],
      ['MoveXNow: -1'],
      ['SupportNow: tile 4,-1 (#6)'],
      ['WallNow: tile 5,-3 (#7, right)'],
      ['CeilingNow: tile 2,-6 (#8)']
    ]);
  });

  it('preserves separate pose, bonk-hold, live grounded-state, live support-contact, live wall-contact, and live ceiling-contact player lines while keeping each line individually wrappable', () => {
    expect(
      buildWrappedDetailLines(
        'Pose: ceiling-bonk\nBonkHold: on\nGroundedNow: off\nFacingNow: right\nMoveXNow: 1\nSupportNow: tile 4,-1 (#6)\nWallNow: tile 5,-3 (#7, right)\nCeilingNow: tile 2,-6 (#8)'
      )
    ).toEqual([
      ['Pose: ceiling-bonk'],
      ['BonkHold: on'],
      ['GroundedNow: off'],
      ['FacingNow: right'],
      ['MoveXNow: 1'],
      ['SupportNow: tile 4,-1 (#6)'],
      ['WallNow: tile 5,-3 (#7, right)'],
      ['CeilingNow: tile 2,-6 (#8)']
    ]);
  });

  it('preserves separate respawn and wall-contact event lines while splitting each line at pipe separators', () => {
    expect(
      buildWrappedDetailLines(
        'Respawn: embedded | spawn 3,-2 | pos 56.00,-32.00 | vel 0.00,0.00\n' +
          'Wall: blocked | tile 5,-3 (#7, right) | pos 88.00,-24.00 | vel -180.00,60.00'
      )
    ).toEqual([
      ['Respawn: embedded', '| spawn 3,-2', '| pos 56.00,-32.00', '| vel 0.00,0.00'],
      ['Wall: blocked', '| tile 5,-3 (#7, right)', '| pos 88.00,-24.00', '| vel -180.00,60.00']
    ]);
  });

  it('preserves separate grounded, facing, respawn, wall-contact, and ceiling-contact event lines while splitting each line at pipe separators', () => {
    expect(
      buildWrappedDetailLines(
        'Ground: landing | pos 80.00,-16.00 | vel 30.00,0.00\n' +
        'Facing: left->right | pos 84.00,-20.00 | vel 120.00,0.00\n' +
        'Respawn: embedded | spawn 3,-2 | pos 56.00,-32.00 | vel 0.00,0.00\n' +
          'Wall: blocked | tile 5,-3 (#7, right) | pos 88.00,-24.00 | vel -180.00,60.00\n' +
          'Ceiling: blocked | tile 2,-6 (#8) | pos 72.00,-48.00 | vel 15.00,-210.00'
      )
    ).toEqual([
      ['Ground: landing', '| pos 80.00,-16.00', '| vel 30.00,0.00'],
      ['Facing: left->right', '| pos 84.00,-20.00', '| vel 120.00,0.00'],
      ['Respawn: embedded', '| spawn 3,-2', '| pos 56.00,-32.00', '| vel 0.00,0.00'],
      ['Wall: blocked', '| tile 5,-3 (#7, right)', '| pos 88.00,-24.00', '| vel -180.00,60.00'],
      ['Ceiling: blocked', '| tile 2,-6 (#8)', '| pos 72.00,-48.00', '| vel 15.00,-210.00']
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
