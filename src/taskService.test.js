import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
	setStorage,
	listTasks,
	createTask,
	updateTask,
	deleteTask,
} from './taskService.js';

beforeEach(() => {
	const data = new Map();
	setStorage({
		getItem: (k) => data.get(k) ?? null,
		setItem: (k, v) => data.set(k, v),
	});
});

test('rejects blank or whitespace-only titles', async () => {
	await assert.rejects(createTask('user-1', { title: '' }), { status: 400 });
	await assert.rejects(createTask('user-1', { title: '   ' }), {
		status: 400,
	});
});

test('creates a task with trimmed fields', async () => {
	const t = await createTask('user-1', { title: '  Buy milk ' });
	assert.equal(t.title, 'Buy milk');
	assert.equal(t.status, 'open');
	assert.equal(t.ownerId, 'user-1');
	assert.deepEqual(await listTasks('user-1'), [t]);
});

test('updates title and description', async () => {
	const t = await createTask('user-1', { title: 'A' });
	const u = await updateTask('user-1', t.id, {
		title: 'B',
		description: 'details',
	});
	assert.equal(u.title, 'B');
	assert.equal(u.description, 'details');
});

test('toggles status open -> done -> open', async () => {
	const t = await createTask('user-1', { title: 'A' });
	assert.equal(
		(await updateTask('user-1', t.id, { status: 'done' })).status,
		'done'
	);
	assert.equal(
		(await updateTask('user-1', t.id, { status: 'open' })).status,
		'open'
	);
});

test('deletes a task', async () => {
	const t = await createTask('user-1', { title: 'A' });
	await deleteTask('user-1', t.id);
	assert.deepEqual(await listTasks('user-1'), []);
});

test('filters by status', async () => {
	const a = await createTask('user-1', { title: 'A' });
	await createTask('user-1', { title: 'B' });
	await updateTask('user-1', a.id, { status: 'done' });
	assert.equal((await listTasks('user-1', 'all')).length, 2);
	assert.deepEqual(
		(await listTasks('user-1', 'done')).map((t) => t.title),
		['A']
	);
	assert.deepEqual(
		(await listTasks('user-1', 'open')).map((t) => t.title),
		['B']
	);
});

test("prevents access to another user's task", async () => {
	const t = await createTask('user-2', { title: 'Secret' });
	assert.deepEqual(await listTasks('user-1'), []);
	await assert.rejects(updateTask('user-1', t.id, { title: 'x' }), {
		status: 403,
	});
	await assert.rejects(deleteTask('user-1', t.id), { status: 403 });
});

test('returns 404 for a missing task', async () => {
	await assert.rejects(updateTask('user-1', 'nope', { title: 'x' }), {
		status: 404,
	});
	await assert.rejects(deleteTask('user-1', 'nope'), { status: 404 });
});
