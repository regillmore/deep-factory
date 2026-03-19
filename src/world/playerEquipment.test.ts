import { describe, expect, it } from 'vitest';

import {
  clonePlayerEquipmentState,
  createDefaultPlayerEquipmentState,
  createPlayerEquipmentState,
  getPlayerArmorItemDefinition,
  getPlayerEquipmentSlotLabel,
  getPlayerEquipmentTotalDefense,
  getStarterArmorItemIdForSlot,
  resolvePlayerArmorReducedDamage,
  setPlayerEquipmentSlot,
  toggleStarterArmorForSlot
} from './playerEquipment';

describe('playerEquipment', () => {
  it('creates an empty default equipment state', () => {
    expect(createDefaultPlayerEquipmentState()).toEqual({
      head: null,
      body: null,
      legs: null
    });
  });

  it('validates that equipped items stay in their owning slots', () => {
    expect(() =>
      createPlayerEquipmentState({
        head: 'starter-greaves'
      })
    ).toThrow('head must target the head slot');
  });

  it('clones equipment state without sharing nested slot values', () => {
    const state = createPlayerEquipmentState({
      head: 'starter-helmet'
    });

    expect(clonePlayerEquipmentState(state)).toEqual(state);
    expect(clonePlayerEquipmentState(state)).not.toBe(state);
  });

  it('equips and unequips the starter piece assigned to each slot', () => {
    const equippedHead = toggleStarterArmorForSlot(createDefaultPlayerEquipmentState(), 'head');
    expect(equippedHead).toEqual({
      head: 'starter-helmet',
      body: null,
      legs: null
    });

    expect(toggleStarterArmorForSlot(equippedHead, 'head')).toEqual(createDefaultPlayerEquipmentState());
  });

  it('can set a slot directly to a specific armor item or clear it', () => {
    const withBody = setPlayerEquipmentSlot(
      createDefaultPlayerEquipmentState(),
      'body',
      'starter-breastplate'
    );
    expect(withBody.body).toBe('starter-breastplate');
    expect(setPlayerEquipmentSlot(withBody, 'body', null).body).toBeNull();
  });

  it('sums defense from all equipped armor pieces', () => {
    expect(
      getPlayerEquipmentTotalDefense(
        createPlayerEquipmentState({
          head: 'starter-helmet',
          body: 'starter-breastplate',
          legs: 'starter-greaves'
        })
      )
    ).toBe(4);
  });

  it('reduces hostile-contact damage by the equipped armor defense while respecting a minimum hit', () => {
    const armored = createPlayerEquipmentState({
      head: 'starter-helmet',
      body: 'starter-breastplate',
      legs: 'starter-greaves'
    });

    expect(resolvePlayerArmorReducedDamage(15, armored)).toBe(11);
    expect(resolvePlayerArmorReducedDamage(3, armored)).toBe(1);
    expect(resolvePlayerArmorReducedDamage(0, armored)).toBe(0);
  });

  it('exposes readable slot labels and starter-item definitions for panel view models', () => {
    expect(getPlayerEquipmentSlotLabel('legs')).toBe('Legs');
    expect(getStarterArmorItemIdForSlot('body')).toBe('starter-breastplate');
    expect(getPlayerArmorItemDefinition('starter-breastplate')).toEqual({
      id: 'starter-breastplate',
      slotId: 'body',
      label: 'Starter Breastplate',
      defense: 2
    });
  });
});
