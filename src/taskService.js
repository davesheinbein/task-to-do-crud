// Mocked async CRUD API backed by localStorage.
export const CURRENT_USER_ID = 'user-1';
const STORAGE_KEY = 'tasks';

let storage = globalThis.localStorage;

// Allows tests to inject an in-memory storage.
export function setStorage(s) {
	storage = s;
}

class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

const read = () => JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
const write = (tasks) => storage.setItem(STORAGE_KEY, JSON.stringify(tasks));

function validateTitle(title) {
	const trimmed = typeof title === 'string' ? title.trim() : '';
	if (!trimmed) throw new ApiError(400, 'Title is required.');
	return trimmed;
}

// Returns the task's index, or throws 404 (missing) / 403 (not owner).
function findOwned(tasks, id, userId) {
	const i = tasks.findIndex((t) => t.id === id);
	if (i === -1) throw new ApiError(404, 'Task not found.');
	if (tasks[i].ownerId !== userId) throw new ApiError(403, 'Forbidden.');
	return i;
}

export async function listTasks(userId, status = 'all') {
	return read().filter(
		(t) => t.ownerId === userId && (status === 'all' || t.status === status)
	);
}

export async function createTask(userId, { title, description = '' }) {
	const now = new Date().toISOString();
	const task = {
		id: crypto.randomUUID(),
		ownerId: userId,
		title: validateTitle(title),
		description: String(description ?? '').trim(),
		status: 'open',
		createdAt: now,
		updatedAt: now,
	};
	write([...read(), task]);
	return task;
}

export async function updateTask(userId, id, changes) {
	const tasks = read();
	const i = findOwned(tasks, id, userId);
	const next = { ...tasks[i] };
	if ('title' in changes) next.title = validateTitle(changes.title);
	if ('description' in changes)
		next.description = String(changes.description ?? '').trim();
	if ('status' in changes) {
		if (!['open', 'done'].includes(changes.status))
			throw new ApiError(400, 'Invalid status.');
		next.status = changes.status;
	}
	next.updatedAt = new Date().toISOString();
	tasks[i] = next;
	write(tasks);
	return next;
}

export async function deleteTask(userId, id) {
	const tasks = read();
	const i = findOwned(tasks, id, userId);
	tasks.splice(i, 1);
	write(tasks);
}
