import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getRoomPresentation } from '../src/constants/roomPresentation.ts';

test('room presentation resolves known rooms from stable ids', () => {
  assert.equal(getRoomPresentation({ id: 'living', name: 'Phòng khách' }).imageKey, 'living');
  assert.equal(getRoomPresentation({ id: 'kitchen', name: 'Nhà bếp' }).imageKey, 'kitchen');
});

test('room presentation resolves server-generated ids from type or Vietnamese name', () => {
  assert.equal(getRoomPresentation({ id: 'room-a1', name: 'Phòng ngủ của bé' }).imageKey, 'bedroom');
  assert.equal(getRoomPresentation({ id: 'room-a2', name: 'Khu nấu ăn', type: 'kitchen' }).imageKey, 'kitchen');
});

test('rooms without illustrations always receive a meaningful icon and label', () => {
  const office = getRoomPresentation({ id: 'room-a3', name: 'Phòng làm việc' });
  assert.equal(office.imageKey, undefined);
  assert.equal(office.icon, 'desktop-outline');
  assert.equal(office.accessibilityLabel, 'Minh họa Phòng làm việc');

  const unknown = getRoomPresentation({ id: 'room-a4', name: 'Không gian mới' });
  assert.equal(unknown.icon, 'home-outline');
});
