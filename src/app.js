import {
	CURRENT_USER_ID as me,
	listTasks,
	createTask,
	updateTask,
	deleteTask,
} from './taskService.js';

const $ = (id) => document.getElementById(id);
const list = $('list');
const msg = $('message');
let filter = 'all';
let editingId = null;
const pending = new Set(); // task ids with an in-flight request

function notify(text, isError = false) {
	msg.textContent = text;
	msg.className = isError ? 'error' : 'success';
}

function el(tag, props = {}, ...children) {
	const e = Object.assign(document.createElement(tag), props);
	e.append(...children);
	return e;
}

async function render() {
	const tasks = await listTasks(me, filter);
	list.replaceChildren(...tasks.map(taskItem));
	$('empty').hidden = tasks.length > 0;
}

// Runs an API call, reports the result, and re-renders either way
// (so a task that no longer exists disappears after a 404).
async function run(fn, okText, id) {
	if (id) {
		if (pending.has(id)) return;
		pending.add(id);
	}
	try {
		await fn();
		notify(okText);
	} catch (e) {
		notify(e.message, true);
	} finally {
		if (id) pending.delete(id);
		await render();
	}
}

function taskItem(t) {
	const li = el('li', { className: t.status === 'done' ? 'done' : '' });
	if (editingId === t.id) {
		const title = el('input', { value: t.title });
		const desc = el('textarea', { value: t.description });
		const save = el('button', { textContent: 'Save' });
		save.onclick = () => {
			editingId = null;
			run(
				() =>
					updateTask(me, t.id, {
						title: title.value,
						description: desc.value,
					}),
				'Task updated.',
				t.id
			);
		};
		const cancel = el('button', { textContent: 'Cancel' });
		cancel.onclick = () => {
			editingId = null;
			render();
		};
		li.append(title, desc, save, cancel);
		return li;
	}
	const toggle = el('input', { type: 'checkbox', checked: t.status === 'done' });
	toggle.onchange = () =>
		run(
			() =>
				updateTask(me, t.id, {
					status: t.status === 'done' ? 'open' : 'done',
				}),
			'Task updated.',
			t.id
		);
	const edit = el('button', { textContent: 'Edit' });
	edit.onclick = () => {
		editingId = t.id;
		render();
	};
	const del = el('button', { textContent: 'Delete' });
	del.onclick = () => run(() => deleteTask(me, t.id), 'Task deleted.', t.id);
	li.append(
		toggle,
		el(
			'div',
			{ className: 'text' },
			el('strong', { textContent: t.title }),
			el('p', { textContent: t.description })
		),
		edit,
		del
	);
	return li;
}

$('form').onsubmit = (e) => {
	e.preventDefault();
	run(async () => {
		await createTask(me, {
			title: $('title').value,
			description: $('description').value,
		});
		e.target.reset();
	}, 'Task created.');
};

document.querySelectorAll('[data-filter]').forEach((b) => {
	b.onclick = () => {
		filter = b.dataset.filter;
		document
			.querySelectorAll('[data-filter]')
			.forEach((x) => x.classList.toggle('active', x === b));
		render();
	};
});

render();
