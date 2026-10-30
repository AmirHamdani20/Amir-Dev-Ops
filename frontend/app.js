const apiUrl = "/api/tasks";
const statuses = Object.freeze({
    TODO: "To do",
    IN_PROGRESS: "In progress",
    DONE: "Completed"
});

const state = {
    tasks: [],
    filter: "ALL",
    search: "",
    editingId: null
};

const elements = {
    list: document.querySelector("#task-list"),
    message: document.querySelector("#message"),
    modal: document.querySelector("#task-modal"),
    form: document.querySelector("#task-form"),
    formHeading: document.querySelector("#form-heading"),
    formError: document.querySelector("#form-error"),
    title: document.querySelector("#title-input"),
    description: document.querySelector("#description-input"),
    status: document.querySelector("#status-input"),
    dueDate: document.querySelector("#due-date-input"),
    saveButton: document.querySelector("#save-button"),
    search: document.querySelector("#search-input")
};

function showMessage(text, type = "error") {
    elements.message.textContent = text;
    elements.message.className = type === "info" ? "message info" : "message";
    elements.message.hidden = false;
}

function clearMessage() {
    elements.message.hidden = true;
    elements.message.textContent = "";
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    if (!response.ok) {
        let detail = "";
        try {
            const body = await response.json();
            detail = body.detail || body.message || body.error || "";
        } catch {
            detail = (await response.text()).slice(0, 180);
        }
        throw new Error(detail || `Request failed (${response.status}). Please try again.`);
    }

    if (response.status === 204) {
        return null;
    }
    return response.json();
}

function formatDate(dateValue) {
    if (!dateValue) return "";
    const date = new Date(`${dateValue}T00:00:00`);
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function isOverdue(task) {
    if (!task.dueDate || task.status === "DONE") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${task.dueDate}T00:00:00`) < today;
}

function makeButton(label, className, onClick, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.addEventListener("click", onClick);
    return button;
}

function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = "task-card";

    const main = document.createElement("div");
    main.className = "task-main";

    const marker = makeButton(
        task.status === "DONE" ? "✓" : "",
        `task-marker${task.status === "DONE" ? " is-done" : ""}`,
        () => changeStatus(task, task.status === "DONE" ? "TODO" : "DONE"),
        task.status === "DONE" ? "Mark as to do" : "Mark as completed"
    );

    const copy = document.createElement("div");
    copy.className = "task-copy";
    const title = document.createElement("h3");
    title.className = `task-title${task.status === "DONE" ? " is-done" : ""}`;
    title.textContent = task.title;
    copy.append(title);

    if (task.description) {
        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description;
        copy.append(description);
    }

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const badge = document.createElement("span");
    badge.className = `status-badge status-${task.status}`;
    badge.textContent = statuses[task.status] || task.status;
    meta.append(badge);

    if (task.dueDate) {
        const dueDate = document.createElement("span");
        dueDate.className = `due-date${isOverdue(task) ? " is-overdue" : ""}`;
        dueDate.textContent = `${isOverdue(task) ? "Overdue · " : "Due "}${formatDate(task.dueDate)}`;
        meta.append(dueDate);
    }

    copy.append(meta);
    main.append(marker, copy);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
        makeButton("✎", "icon-button", () => openForm(task), `Edit ${task.title}`),
        makeButton("×", "icon-button delete-button", () => deleteTask(task), `Delete ${task.title}`)
    );
    card.append(main, actions);
    return card;
}

function renderEmptyState(title, description) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "✦";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = description;
    empty.append(icon, heading, copy);
    return empty;
}

function render() {
    const counts = {
        ALL: state.tasks.length,
        TODO: state.tasks.filter(task => task.status === "TODO").length,
        IN_PROGRESS: state.tasks.filter(task => task.status === "IN_PROGRESS").length,
        DONE: state.tasks.filter(task => task.status === "DONE").length
    };
    const completedPercent = counts.ALL ? Math.round((counts.DONE / counts.ALL) * 100) : 0;

    document.querySelector("#nav-total").textContent = counts.ALL;
    document.querySelector("#stat-total").textContent = counts.ALL;
    document.querySelector("#stat-progress").textContent = counts.IN_PROGRESS;
    document.querySelector("#stat-done").textContent = counts.DONE;
    document.querySelector("#stat-percent").textContent = completedPercent;
    document.querySelector("#progress-bar").style.width = `${completedPercent}%`;
    document.querySelector("#count-all").textContent = counts.ALL;
    document.querySelector("#count-todo").textContent = counts.TODO;
    document.querySelector("#count-progress").textContent = counts.IN_PROGRESS;
    document.querySelector("#count-done").textContent = counts.DONE;

    const visibleTasks = state.tasks.filter(task => {
        const matchesFilter = state.filter === "ALL" || task.status === state.filter;
        const query = state.search.trim().toLocaleLowerCase();
        const matchesSearch = !query
            || task.title.toLocaleLowerCase().includes(query)
            || (task.description || "").toLocaleLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    elements.list.replaceChildren();
    if (!visibleTasks.length) {
        if (!state.tasks.length) {
            elements.list.append(renderEmptyState("A fresh start", "Add your first task and make today count."));
        } else {
            elements.list.append(renderEmptyState("No tasks found", "Try another filter or search term."));
        }
        return;
    }

    visibleTasks.forEach(task => elements.list.append(createTaskCard(task)));
}

async function loadTasks() {
    clearMessage();
    try {
        state.tasks = await request(apiUrl);
        render();
    } catch (error) {
        state.tasks = [];
        render();
        showMessage(`Couldn't load your tasks. ${error.message}`);
    }
}

function openForm(task = null) {
    state.editingId = task ? task.id : null;
    elements.form.reset();
    elements.formError.hidden = true;
    elements.formError.textContent = "";
    elements.formHeading.textContent = task ? "Edit task" : "Create a task";
    elements.saveButton.textContent = task ? "Save changes" : "Create task";
    if (task) {
        elements.title.value = task.title;
        elements.description.value = task.description || "";
        elements.status.value = task.status;
        elements.dueDate.value = task.dueDate || "";
    } else {
        elements.status.value = "TODO";
    }
    elements.modal.hidden = false;
    document.body.style.overflow = "hidden";
    elements.title.focus();
}

function closeForm() {
    elements.modal.hidden = true;
    document.body.style.overflow = "";
    state.editingId = null;
}

async function saveTask(event) {
    event.preventDefault();
    const task = {
        title: elements.title.value.trim(),
        description: elements.description.value.trim() || null,
        status: elements.status.value,
        dueDate: elements.dueDate.value || null
    };

    if (!task.title) {
        elements.formError.textContent = "Please enter a task name.";
        elements.formError.hidden = false;
        elements.title.focus();
        return;
    }

    elements.saveButton.disabled = true;
    elements.saveButton.textContent = "Saving...";
    elements.formError.hidden = true;
    try {
        if (state.editingId) {
            await request(`${apiUrl}/${state.editingId}`, { method: "PUT", body: JSON.stringify(task) });
        } else {
            await request(apiUrl, { method: "POST", body: JSON.stringify(task) });
        }
        closeForm();
        await loadTasks();
    } catch (error) {
        elements.formError.textContent = `Couldn't save the task. ${error.message}`;
        elements.formError.hidden = false;
    } finally {
        elements.saveButton.disabled = false;
        elements.saveButton.textContent = state.editingId ? "Save changes" : "Create task";
    }
}

async function changeStatus(task, status) {
    clearMessage();
    try {
        await request(`${apiUrl}/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({
                title: task.title,
                description: task.description,
                status,
                dueDate: task.dueDate
            })
        });
        await loadTasks();
    } catch (error) {
        showMessage(`Couldn't update the task. ${error.message}`);
    }
}

async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    clearMessage();
    try {
        await request(`${apiUrl}/${task.id}`, { method: "DELETE" });
        await loadTasks();
    } catch (error) {
        showMessage(`Couldn't delete the task. ${error.message}`);
    }
}

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach(item => {
            const selected = item.dataset.filter === state.filter;
            item.classList.toggle("is-active", selected && item.classList.contains("nav-item"));
            item.classList.toggle("is-selected", selected && item.classList.contains("filter-chip"));
        });
        render();
    });
});

document.querySelector("#new-task-button").addEventListener("click", () => openForm());
document.querySelector("#close-modal-button").addEventListener("click", closeForm);
document.querySelector("#cancel-button").addEventListener("click", closeForm);
elements.form.addEventListener("submit", saveTask);
elements.search.addEventListener("input", event => {
    state.search = event.target.value;
    render();
});
elements.modal.addEventListener("click", event => {
    if (event.target === elements.modal) closeForm();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !elements.modal.hidden) closeForm();
});

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
}).format(new Date()).toLocaleUpperCase();

loadTasks();
