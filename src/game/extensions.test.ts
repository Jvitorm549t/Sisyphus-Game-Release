/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { UpgradeSystem } from './extensions/upgrades';
import { SkinManager } from './extensions/skins';
import { AchievementSystem } from './extensions/achievements';
import { TerrainManager } from './extensions/terrains';
import { AchievementStats } from './types';

const createDefaultStats = (overrides: Partial<AchievementStats> = {}): AchievementStats => ({
  maxDistance: 0,
  currentDistance: 0,
  inputsPerSecond: 0,
  metersRolledBack: 0,
  totalInputs: 0,
  totalUpgradesPurchased: 0,
  strengthLevel: 0,
  frictionLevel: 0,
  enduranceLevel: 0,
  resonanceLevel: 0,
  maxedUpgradeTiersCount: 0,
  unlockedSkinsCount: 1,
  unlockedTerrainsCount: 1,
  currentWeather: 'calm',
  velocity: 0,
  activeSkinId: 'corinthian_limestone',
  activeTerrainId: 'asphodel_gravel',
  ...overrides,
});

test('Extensions: Upgrade system calculates costs and modifies dynamic attributes', () => {
  const up = new UpgradeSystem();
  up.reset();

  const modifiers0 = up.computeModifiers();
  assert.equal(modifiers0.strengthMultiplier, 1.0);

  // Can afford strength upgrade with 30m
  assert.equal(up.canPurchase('strength', 30), true);
  assert.equal(up.canPurchase('strength', 10), false);

  // Purchase strength
  const res = up.purchase('strength', 30);
  assert.equal(res.success, true);

  const modifiers1 = up.computeModifiers();
  assert.ok(modifiers1.strengthMultiplier > 1.0, 'Strength multiplier should have increased');
  assert.equal(up.getTotalPurchasedLevels(), 1);
  assert.equal(up.getLevel('strength'), 1);
});

test('Extensions: Skin manager locks and unlocks skins based on max distance', () => {
  const manager = new SkinManager();
  const skins = manager.getSkins();

  const obsidian = skins.find((s) => s.id === 'tartarus_obsidian')!;
  assert.equal(manager.isUnlocked(obsidian, 20), false);
  assert.equal(manager.isUnlocked(obsidian, 60), true);

  // Select fails if locked
  assert.equal(manager.selectSkin('tartarus_obsidian', 20), false);
  // Select succeeds if unlocked
  assert.equal(manager.selectSkin('tartarus_obsidian', 60), true);
  assert.equal(manager.getActiveSkin().id, 'tartarus_obsidian');
  assert.equal(manager.getUnlockedCount(60), 2);
});

test('Extensions: Achievements unlock on meeting condition thresholds', () => {
  let notified = false;
  const sys = new AchievementSystem(() => {
    notified = true;
  });
  sys.reset();

  const unlocked = sys.checkAchievements(
    createDefaultStats({
      maxDistance: 12,
      currentDistance: 12,
      inputsPerSecond: 18,
      totalInputs: 50,
    })
  );

  assert.ok(unlocked.length >= 2, 'Should unlock first steps and speed demon achievements');
  assert.equal(notified, true);
});

test('Extensions: Climbing to 100.000m unlocks the legendary centenary summit achievement', () => {
  const sys = new AchievementSystem();
  sys.reset();

  // At 50.000m, centenary_summit (100k) should NOT be unlocked
  sys.checkAchievements(createDefaultStats({ maxDistance: 50000 }));
  const ach50k = sys.getAchievements().find((a) => a.id === 'centenary_summit')!;
  assert.equal(ach50k.unlocked, false);

  // At 100.000m, centenary_summit MUST unlock
  const newUnlocks = sys.checkAchievements(createDefaultStats({ maxDistance: 100000 }));
  const ach100k = sys.getAchievements().find((a) => a.id === 'centenary_summit')!;
  assert.equal(ach100k.unlocked, true);
  assert.ok(newUnlocks.some((a) => a.id === 'centenary_summit'));
});

test('Extensions: Purchasing upgrades unlocks upgrade tier and mastery achievements', () => {
  const sys = new AchievementSystem();
  sys.reset();

  // 1 upgrade bought
  let unlocks = sys.checkAchievements(
    createDefaultStats({
      totalUpgradesPurchased: 1,
      strengthLevel: 1,
    })
  );
  assert.ok(unlocks.some((a) => a.id === 'first_upgrade'));

  // 10 upgrades bought and max strength
  unlocks = sys.checkAchievements(
    createDefaultStats({
      totalUpgradesPurchased: 10,
      strengthLevel: 10,
    })
  );
  assert.ok(unlocks.some((a) => a.id === 'ten_upgrades'));
  assert.ok(unlocks.some((a) => a.id === 'max_strength'));

  // All 4 tiers maxed
  unlocks = sys.checkAchievements(
    createDefaultStats({
      totalUpgradesPurchased: 29,
      maxedUpgradeTiersCount: 4,
    })
  );
  assert.ok(unlocks.some((a) => a.id === 'arsenal_master'));
});

test('Extensions: Terrain selection respects distance unlocks', () => {
  const tm = new TerrainManager();
  const terrains = tm.getTerrains();
  const sulfur = terrains.find((t) => t.id === 'sulfur_crags')!;

  assert.equal(tm.isUnlocked(sulfur, 10), false);
  assert.equal(tm.isUnlocked(sulfur, 70), true);
  assert.equal(tm.getUnlockedCount(70), 2);
});
