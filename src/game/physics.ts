/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhysicsConfig, SimulationState, DynamicModifiers } from './types';

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  slopeAngleDeg: 26,        // 26 degree steep Tartarus mountain grade
  gravity: 9.8,             // Gravity standard
  rollingFriction: 3.5,     // Rolling resistance opposing direction of motion
  stoneRadius: 38,          // Stone radius in canvas pixels
  stoneMass: 45,            // Inertial resistance
  basePushImpulse: 28,      // Force added per individual tap/press
  maxRollbackSpeed: -14,    // Downhill speed limit
  maxForwardSpeed: 24,      // Uphill sprint limit
  maxAdditionalSlopeDeg: 20, // Maximum progressive steepness increase
};

export const DEFAULT_MODIFIERS: DynamicModifiers = {
  strengthMultiplier: 1.0,
  frictionMultiplier: 1.0,
  enduranceMultiplier: 1.0,
  multiFingerBonus: 1.15, // 15% extra force when 2+ parallel inputs register simultaneously
};

/**
 * Calculates dynamic slope steepness as a function of distance climbed.
 * Increases the slope angle progressively from the base angle towards a steep peak,
 * directly increasing the gravitational pull on the boulder.
 */
export function calculateDynamicSlopeSteepness(
  baseSlopeAngleDeg: number,
  distance: number,
  maxAdditionalDeg: number = 20
): { angleDeg: number; multiplier: number } {
  // Safe distance clamp
  const safeDist = Math.max(0, distance);
  // Smooth non-linear steepening curve over the first 250 meters
  const progress = Math.min(1.0, safeDist / 250);
  const additionalDeg = Math.min(maxAdditionalDeg, Math.pow(progress, 0.85) * maxAdditionalDeg);
  const angleDeg = baseSlopeAngleDeg + additionalDeg;

  const baseRad = (baseSlopeAngleDeg * Math.PI) / 180;
  const currentRad = (angleDeg * Math.PI) / 180;
  // Multiplier of gravity pull relative to base slope: sin(theta) / sin(theta_base)
  const multiplier = Math.sin(currentRad) / Math.sin(baseRad);

  return { angleDeg, multiplier };
}

export function createInitialSimulationState(baseSlopeAngleDeg: number = DEFAULT_PHYSICS_CONFIG.slopeAngleDeg): SimulationState {
  return {
    distance: 0,
    velocity: 0,
    acceleration: 0,
    stoneAngle: 0,
    pushForceQueue: [],
    lastInputTimestamp: 0,
    isRollingBackward: false,
    totalMetersPushed: 0,
    activeInputBurstCount: 0,
    currentSlopeAngleDeg: baseSlopeAngleDeg,
    slopeSteepnessMultiplier: 1.0,
  };
}

/**
 * Pure physics step function. Deterministic and testable via Node test runner.
 * Computes gravity on inclined plane with dynamic slope steepness, friction,
 * parallel accumulated push forces, integration of velocity and position, and rotation angle.
 */
export function stepPhysics(
  state: SimulationState,
  dt: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
  modifiers: DynamicModifiers = DEFAULT_MODIFIERS
): SimulationState {
  // Clamp delta time to avoid tunneling or numerical explosion on frame hiccups
  const clampedDt = Math.max(0.0001, Math.min(dt, 0.05));

  // Compute dynamic slope steepness based on distance traveled
  const maxAdd = config.maxAdditionalSlopeDeg ?? 20;
  const { angleDeg: dynamicSlopeAngleDeg, multiplier: slopeSteepnessMultiplier } =
    calculateDynamicSlopeSteepness(config.slopeAngleDeg, state.distance, maxAdd);

  // Convert dynamic slope angle to radians
  const slopeRad = (dynamicSlopeAngleDeg * Math.PI) / 180;

  // Base gravity pull along slope: F_gravity = mass * g * sin(theta_dynamic) * weatherGravity
  // Endurance modifier reduces perceived gravity drag
  const weatherGrav = modifiers.weatherGravityMultiplier ?? 1.0;
  const effectiveGravity = (config.gravity * Math.sin(slopeRad) * weatherGrav) / modifiers.enduranceMultiplier;
  const gravityForce = -effectiveGravity * config.stoneMass;

  // Process parallel push force queue
  // Each tap delivers an immediate impulse (momentum transfer), modulated by weather
  let accumulatedImpulseDeltaV = 0;
  const inputCount = state.pushForceQueue.length;
  const weatherPush = modifiers.weatherPushMultiplier ?? 1.0;

  if (inputCount > 0) {
    // Multi-finger simultaneous synergy: if player presses 2+ inputs at once, apply bonus
    const multiMultiplier = inputCount > 1
      ? 1 + (inputCount - 1) * (modifiers.multiFingerBonus - 1)
      : 1.0;

    for (let i = 0; i < inputCount; i++) {
      const impulse = state.pushForceQueue[i] * modifiers.strengthMultiplier * multiMultiplier * weatherPush;
      // Delta V = Impulse / mass
      accumulatedImpulseDeltaV += impulse / config.stoneMass;
    }
  }

  // Rolling friction: opposes direction of motion, modulated by weather conditions (e.g. wet fog vs scree rockfall)
  const normalForce = config.stoneMass * config.gravity * Math.cos(slopeRad);
  const weatherFric = modifiers.weatherFrictionMultiplier ?? 1.0;
  const frictionCoeff = config.rollingFriction * modifiers.frictionMultiplier * weatherFric;
  let frictionForce = 0;

  if (Math.abs(state.velocity) > 0.01) {
    frictionForce = -Math.sign(state.velocity) * frictionCoeff * normalForce * 0.05;
  }

  // Continuous forces (gravity + friction + weather wind/downdraft force)
  const windForce = modifiers.weatherWindForce ?? 0;
  const continuousNetForce = gravityForce + frictionForce + windForce;
  const acceleration = continuousNetForce / config.stoneMass;

  // Integrate velocity: v = v0 + a * dt + sum(deltaV_impulses)
  let newVelocity = state.velocity + acceleration * clampedDt + accumulatedImpulseDeltaV;

  // Clamp velocity to physical terminal boundaries
  if (newVelocity > config.maxForwardSpeed) {
    newVelocity = config.maxForwardSpeed;
  } else if (newVelocity < config.maxRollbackSpeed) {
    newVelocity = config.maxRollbackSpeed;
  }

  // Integrate distance along slope: s = s0 + v * dt
  const distanceDelta = newVelocity * clampedDt;
  let newDistance = state.distance + distanceDelta;

  // Bounds clamp: Cannot roll backward beyond the initial foot of the mountain (0m)
  if (newDistance < 0) {
    newDistance = 0;
    if (newVelocity < 0) {
      newVelocity = 0;
    }
  }

  // Rolling rotation: deltaTheta = deltaDistanceInPixels / radius
  const pixelsRolled = distanceDelta * 40;
  const deltaAngle = pixelsRolled / config.stoneRadius;
  const newStoneAngle = (state.stoneAngle + deltaAngle) % (2 * Math.PI);

  const isRollingBackward = newVelocity < -0.01;
  const totalMetersPushed = distanceDelta > 0
    ? state.totalMetersPushed + distanceDelta
    : state.totalMetersPushed;

  return {
    distance: newDistance,
    velocity: newVelocity,
    acceleration,
    stoneAngle: newStoneAngle,
    pushForceQueue: [], // Cleared after being integrated in this physics step
    lastInputTimestamp: state.lastInputTimestamp,
    isRollingBackward,
    totalMetersPushed,
    activeInputBurstCount: inputCount,
    currentSlopeAngleDeg: dynamicSlopeAngleDeg,
    slopeSteepnessMultiplier,
  };
}

/**
 * Enqueue a parallel push impulse. Supports multiple keys/clicks within the same frame.
 */
export function enqueuePushImpulse(
  state: SimulationState,
  impulse: number,
  timestamp: number
): SimulationState {
  return {
    ...state,
    pushForceQueue: [...state.pushForceQueue, impulse],
    lastInputTimestamp: timestamp,
  };
}
