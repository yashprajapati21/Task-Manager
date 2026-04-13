const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const dueDateInput = document.getElementById("due-date-input");
const priorityInput = document.getElementById("priority-input");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed");
const markAllCompleteBtn = document.getElementById("mark-all-complete");
const filterButtons = document.querySelectorAll(".filter-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarOpenInline = document.getElementById("sidebar-open-inline");
const sidebarDrawer = document.getElementById("sidebar-drawer");
const sidebarClose = document.getElementById("sidebar-close");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const sidebarMarkAll = document.getElementById("sidebar-mark-all");
const sidebarClearCompleted = document.getElementById("sidebar-clear-completed");
const sidebarShowOverdue = document.getElementById("sidebar-show-overdue");
const sidebarFocusDue = document.getElementById("sidebar-focus-due");
const sidebarFilterButtons = document.querySelectorAll(".sidebar-filter");
const statTotal = document.getElementById("stat-total");
const statPending = document.getElementById("stat-pending");
const statCompleted = document.getElementById("stat-completed");
const statDueToday = document.getElementById("stat-due-today");
const dashboardCards = document.querySelectorAll(".dashboard-card");
const dashboardTotal = document.getElementById("dashboard-total");
const dashboardOverdue = document.getElementById("dashboard-overdue");
const dashboardDueSoon = document.getElementById("dashboard-due-soon");
const dashboardHigh = document.getElementById("dashboard-high");
const dashboardCompleted = document.getElementById("dashboard-completed");
const dashboardToday = document.getElementById("dashboard-today");
const widgetProgressPercent = document.getElementById("widget-progress-percent");
const widgetProgressFill = document.getElementById("widget-progress-fill");
const widgetProgressText = document.getElementById("widget-progress-text");
const widgetNextTitle = document.getElementById("widget-next-title");
const widgetNextMeta = document.getElementById("widget-next-meta");
const widgetFocusTitle = document.getElementById("widget-focus-title");
const widgetFocusCopy = document.getElementById("widget-focus-copy");
const widgetFocusButton = document.getElementById("widget-focus-button");
const widgetCompactToggle = document.getElementById("widget-compact-toggle");
const themeToggle = document.getElementById("theme-toggle");

const STORAGE_KEY = "task-manager-items";
const THEME_KEY = "task-manager-theme";

let tasks = loadTasks();
let activeFilter = "all";
let searchQuery = "";
let sortMode = "newest";
let compactView = false;
let isDarkMode = loadThemePreference();

const PRIORITY_RANK = {
	high: 3,
	medium: 2,
	low: 1,
};

renderTasks();
setSidebarVisible(false);
setDashboardCardsActive("all");
updateWidgets();
applyTheme(isDarkMode);

taskForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const title = taskInput.value.trim();
	if (!title) {
		return;
	}

	tasks.push({
		id: crypto.randomUUID(),
		title,
		completed: false,
		dueDate: dueDateInput.value || "",
		priority: priorityInput.value,
		createdAt: Date.now(),
	});

	taskInput.value = "";
	dueDateInput.value = "";
	priorityInput.value = "medium";
	saveTasks();
	renderTasks();
});

searchInput.addEventListener("input", () => {
	searchQuery = searchInput.value.trim().toLowerCase();
	renderTasks();
});

sortSelect.addEventListener("change", () => {
	sortMode = sortSelect.value;
	renderTasks();
});

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		setActiveFilter(button.dataset.filter);
		setDashboardCardsActive(button.dataset.filter);
		renderTasks();
	});
});

dashboardCards.forEach((card) => {
	card.addEventListener("click", () => {
		const filterName = card.dataset.dashboardFilter;
		setFilterFromDashboard(filterName);
		setDashboardCardsActive(filterName);
		renderTasks();
	});
});

clearCompletedBtn.addEventListener("click", () => {
	tasks = tasks.filter((task) => !task.completed);
	saveTasks();
	renderTasks();
});

markAllCompleteBtn.addEventListener("click", () => {
	markAllTasksComplete();
});

sidebarMarkAll.addEventListener("click", () => {
	markAllTasksComplete();
	setSidebarVisible(false);
});

sidebarClearCompleted.addEventListener("click", () => {
	tasks = tasks.filter((task) => !task.completed);
	saveTasks();
	renderTasks();
	setSidebarVisible(false);
});

sidebarShowOverdue.addEventListener("click", () => {
	setActiveFilter("overdue");
	setDashboardCardsActive("overdue");
	searchQuery = "";
	searchInput.value = "";
	renderTasks();
	setSidebarVisible(false);
});

sidebarFocusDue.addEventListener("click", () => {
	sortMode = "due-soon";
	sortSelect.value = "due-soon";
	setActiveFilter("all");
	setDashboardCardsActive("due-soon");
	renderTasks();
	setSidebarVisible(false);
});

widgetFocusButton.addEventListener("click", () => {
	setActiveFilter("due-soon");
	setDashboardCardsActive("due-soon");
	sortMode = "due-soon";
	sortSelect.value = "due-soon";
	renderTasks();
});

widgetCompactToggle.addEventListener("click", () => {
	compactView = !compactView;
	document.body.classList.toggle("compact-view", compactView);
	widgetCompactToggle.textContent = compactView ? "Disable Compact View" : "Enable Compact View";
	updateWidgets();
});

themeToggle.addEventListener("click", () => {
	isDarkMode = !isDarkMode;
	applyTheme(isDarkMode);
	saveThemePreference(isDarkMode);
});

sidebarFilterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		setActiveFilter(button.dataset.sidebarFilter);
		setDashboardCardsActive(button.dataset.sidebarFilter);
		renderTasks();
		setSidebarVisible(false);
	});
});

sidebarToggle.addEventListener("click", () => {
	setSidebarVisible(true);
});

sidebarOpenInline.addEventListener("click", () => {
	setSidebarVisible(true);
});

sidebarClose.addEventListener("click", () => {
	setSidebarVisible(false);
});

sidebarOverlay.addEventListener("click", () => {
	setSidebarVisible(false);
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		setSidebarVisible(false);
	}
});

taskList.addEventListener("click", (event) => {
	const target = event.target;
	const item = target.closest(".task-item");
	if (!item) {
		return;
	}

	const { id } = item.dataset;

	if (target.classList.contains("delete-btn")) {
		deleteTask(id);
		return;
	}

	if (target.classList.contains("task-check")) {
		return;
	}

	if (target.classList.contains("edit-btn")) {
		startInlineEdit(item);
		return;
	}

	if (target.classList.contains("task-title") && target.getAttribute("contenteditable") === "true") {
		return;
	}

	toggleTask(id, !getTaskById(id).completed);
	setDashboardCardsActive(activeFilter);
});

taskList.addEventListener("keydown", (event) => {
	const target = event.target;
	if (!target.classList.contains("task-title") || target.getAttribute("contenteditable") !== "true") {
		return;
	}

	const item = target.closest(".task-item");
	if (!item) {
		return;
	}

	if (event.key === "Enter") {
		event.preventDefault();
		saveInlineEdit(item);
	}

	if (event.key === "Escape") {
		event.preventDefault();
		cancelInlineEdit(item);
	}
});

taskList.addEventListener("blur", (event) => {
	const target = event.target;
	if (!target.classList.contains("task-title") || target.getAttribute("contenteditable") !== "true") {
		return;
	}

	const item = target.closest(".task-item");
	if (!item) {
		return;
	}

	saveInlineEdit(item);
}, true);

taskList.addEventListener("change", (event) => {
	const target = event.target;
	if (!target.classList.contains("task-check")) {
		return;
	}

	const item = target.closest(".task-item");
	if (!item) {
		return;
	}

	toggleTask(item.dataset.id, target.checked);
});

function loadTasks() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}

		const parsedTasks = JSON.parse(raw);
		if (!Array.isArray(parsedTasks)) {
			return [];
		}

		return parsedTasks.map((task) => ({
			id: task.id || crypto.randomUUID(),
			title: String(task.title || ""),
			completed: Boolean(task.completed),
			dueDate: task.dueDate || "",
			priority: PRIORITY_RANK[task.priority] ? task.priority : "medium",
			createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now(),
		}));
	} catch {
		return [];
	}
}

function saveTasks() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadThemePreference() {
	return localStorage.getItem(THEME_KEY) === "dark";
}

function saveThemePreference(useDarkMode) {
	localStorage.setItem(THEME_KEY, useDarkMode ? "dark" : "light");
}

function applyTheme(useDarkMode) {
	document.body.classList.toggle("dark-mode", useDarkMode);
	themeToggle.textContent = useDarkMode ? "Light Mode" : "Dark Mode";
	themeToggle.setAttribute("aria-pressed", String(useDarkMode));
	themeToggle.classList.toggle("theme-toggle-active", useDarkMode);
}

function markAllTasksComplete() {
	tasks = tasks.map((task) => ({ ...task, completed: true }));
	saveTasks();
	renderTasks();
}

function getVisibleTasks() {
	const today = startOfToday();
	const dueSoonLimit = new Date(today);
	dueSoonLimit.setDate(dueSoonLimit.getDate() + 3);

	return tasks.filter((task) => {
		const filterMatch =
			activeFilter === "all" ||
			(activeFilter === "active" && !task.completed) ||
			(activeFilter === "completed" && task.completed) ||
			(activeFilter === "overdue" && isOverdue(task, today)) ||
			(activeFilter === "due-soon" && isDueSoon(task, today, dueSoonLimit)) ||
			(activeFilter === "today" && isDueToday(task, today)) ||
			(activeFilter === "high-priority" && task.priority === "high");

		const searchMatch = task.title.toLowerCase().includes(searchQuery);

		return filterMatch && searchMatch;
	});
}

function renderTasks() {
	const visibleTasks = sortTasks(getVisibleTasks());

	if (visibleTasks.length === 0) {
		taskList.innerHTML = "<li class=\"task-item\"><p class=\"task-text\">No tasks found.</p></li>";
	} else {
		taskList.innerHTML = visibleTasks
			.map(
				(task) => `
				<li class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
					<input class="task-check" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task as completed">
					<div>
						<p class="task-title" aria-label="Task title">${escapeHtml(task.title)}</p>
						<div class="task-meta">
							<span class="priority-badge priority-${task.priority}">${capitalize(task.priority)} Priority</span>
							${task.dueDate ? `<span class="due-date">Due: ${formatDueDate(task.dueDate)}</span>` : ""}
						</div>
					</div>
					<div class="item-actions">
						<button type="button" class="edit-btn">Edit</button>
						<button type="button" class="delete-btn">Delete</button>
					</div>
				</li>
			`
			)
			.join("");
	}

	updateTaskCount();
	updateSidebarStats();
	updateWidgets();
}

function updateTaskCount() {
	const pending = tasks.filter((task) => !task.completed).length;
	taskCount.textContent = `${pending} task${pending === 1 ? "" : "s"} left`;
}

function updateSidebarStats() {
	const today = startOfToday();
	const dueSoonLimit = new Date(today);
	dueSoonLimit.setDate(dueSoonLimit.getDate() + 3);
	const total = tasks.length;
	const pending = tasks.filter((task) => !task.completed).length;
	const completed = total - pending;
	const dueToday = tasks.filter((task) => isDueToday(task, today)).length;
	const overdue = tasks.filter((task) => isOverdue(task, today)).length;
	const dueSoon = tasks.filter((task) => isDueSoon(task, today, dueSoonLimit)).length;
	const highPriority = tasks.filter((task) => task.priority === "high" && !task.completed).length;

	statTotal.textContent = String(total);
	statPending.textContent = String(pending);
	statCompleted.textContent = String(completed);
	statDueToday.textContent = String(dueToday);
	dashboardTotal.textContent = String(total);
	dashboardOverdue.textContent = String(overdue);
	dashboardDueSoon.textContent = String(dueSoon);
	dashboardHigh.textContent = String(highPriority);
	dashboardCompleted.textContent = String(completed);
	dashboardToday.textContent = String(dueToday);
}

function updateWidgets() {
	const today = startOfToday();
	const pendingTasks = tasks.filter((task) => !task.completed);
	const completedTasks = tasks.filter((task) => task.completed);
	const dueSoonLimit = new Date(today);
	dueSoonLimit.setDate(dueSoonLimit.getDate() + 3);
	const overdueCount = tasks.filter((task) => isOverdue(task, today)).length;
	const dueSoonCount = tasks.filter((task) => isDueSoon(task, today, dueSoonLimit)).length;
	const progressPercent = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

	widgetProgressPercent.textContent = `${progressPercent}%`;
	widgetProgressFill.style.width = `${progressPercent}%`;
	widgetProgressText.textContent = tasks.length === 0
		? "No tasks yet. Add one to start tracking progress."
		: `${completedTasks.length} completed, ${pendingTasks.length} pending.`;

	const nextTask = pendingTasks
		.filter((task) => task.dueDate)
		.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] || pendingTasks[0];

	if (nextTask) {
		widgetNextTitle.textContent = nextTask.title;
		widgetNextMeta.textContent = nextTask.dueDate
			? `Due ${formatDueDate(nextTask.dueDate)} · ${capitalize(nextTask.priority)} priority`
			: `${capitalize(nextTask.priority)} priority · No due date set`;
	} else {
		widgetNextTitle.textContent = "No upcoming task";
		widgetNextMeta.textContent = "Finish or add tasks to see what is next.";
	}

	widgetFocusTitle.textContent = overdueCount > 0 ? "Urgent work waiting" : dueSoonCount > 0 ? "Due soon tasks" : "Stay on track";
	widgetFocusCopy.textContent = overdueCount > 0
		? `${overdueCount} overdue task${overdueCount === 1 ? " needs" : "s need"} attention.`
		: dueSoonCount > 0
			? `${dueSoonCount} task${dueSoonCount === 1 ? " is" : "s are"} coming up soon.`
			: "Your list is calm. Keep it that way.";

	widgetCompactToggle.textContent = compactView ? "Disable Compact View" : "Enable Compact View";
}

function deleteTask(id) {
	tasks = tasks.filter((task) => task.id !== id);
	saveTasks();
	renderTasks();
}

function getTaskById(id) {
	return tasks.find((task) => task.id === id) || { completed: false };
}

function toggleTask(id, completed) {
	tasks = tasks.map((task) => (task.id === id ? { ...task, completed } : task));
	saveTasks();
	renderTasks();
}

function startInlineEdit(item) {
	const titleElement = item.querySelector(".task-title");
	if (!titleElement || titleElement.getAttribute("contenteditable") === "true") {
		return;
	}

	titleElement.dataset.originalText = titleElement.textContent || "";
	titleElement.setAttribute("contenteditable", "true");
	titleElement.setAttribute("aria-readonly", "false");
	titleElement.classList.add("editing");
	titleElement.focus();

	const range = document.createRange();
	range.selectNodeContents(titleElement);
	const selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);
}

function saveInlineEdit(item) {
	const titleElement = item.querySelector(".task-title");
	if (!titleElement || titleElement.getAttribute("contenteditable") !== "true") {
		return;
	}

	const id = item.dataset.id;
	const updatedTitle = titleElement.textContent.trim();
	const originalTitle = titleElement.dataset.originalText || "";

	if (!updatedTitle) {
		titleElement.textContent = originalTitle;
		finishInlineEdit(titleElement);
		return;
	}

	tasks = tasks.map((task) => (task.id === id ? { ...task, title: updatedTitle } : task));
	saveTasks();
	finishInlineEdit(titleElement);
	renderTasks();
}

function cancelInlineEdit(item) {
	const titleElement = item.querySelector(".task-title");
	if (!titleElement || titleElement.getAttribute("contenteditable") !== "true") {
		return;
	}

	titleElement.textContent = titleElement.dataset.originalText || titleElement.textContent;
	finishInlineEdit(titleElement);
}

function finishInlineEdit(titleElement) {
	titleElement.removeAttribute("contenteditable");
	titleElement.setAttribute("aria-readonly", "true");
	titleElement.classList.remove("editing");
	delete titleElement.dataset.originalText;
}

function setSidebarVisible(isVisible) {
	sidebarDrawer.classList.toggle("open", isVisible);
	sidebarOverlay.hidden = !isVisible;
	sidebarToggle.setAttribute("aria-expanded", String(isVisible));
}

function setActiveFilter(filterName) {
	activeFilter = filterName;

	filterButtons.forEach((button) => {
		button.classList.toggle("active", button.dataset.filter === filterName);
	});
}

function setDashboardCardsActive(filterName) {
	dashboardCards.forEach((card) => {
		card.classList.toggle("active", card.dataset.dashboardFilter === filterName);
	});
}

function setFilterFromDashboard(filterName) {
	if (filterName === "today") {
		setActiveFilter("today");
		return;
	}

	setActiveFilter(filterName);
}

function startOfToday() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
}

function parseTaskDate(dateValue) {
	if (!dateValue) {
		return null;
	}

	const parsedDate = new Date(`${dateValue}T00:00:00`);
	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function isOverdue(task, today = startOfToday()) {
	if (task.completed) {
		return false;
	}

	const dueDate = parseTaskDate(task.dueDate);
	return Boolean(dueDate && dueDate < today);
}

function isDueToday(task, today = startOfToday()) {
	if (task.completed) {
		return false;
	}

	const dueDate = parseTaskDate(task.dueDate);
	return Boolean(dueDate && dueDate.getTime() === today.getTime());
}

function isDueSoon(task, today = startOfToday(), limit = startOfToday()) {
	if (task.completed) {
		return false;
	}

	const dueDate = parseTaskDate(task.dueDate);
	return Boolean(dueDate && dueDate >= today && dueDate <= limit);
}

function sortTasks(taskItems) {
	const sorted = [...taskItems];

	sorted.sort((a, b) => {
		if (sortMode === "oldest") {
			return a.createdAt - b.createdAt;
		}

		if (sortMode === "priority") {
			const rankDelta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
			return rankDelta !== 0 ? rankDelta : b.createdAt - a.createdAt;
		}

		if (sortMode === "due-soon") {
			const aHasDueDate = Boolean(a.dueDate);
			const bHasDueDate = Boolean(b.dueDate);

			if (aHasDueDate && bHasDueDate) {
				const dateDelta = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
				return dateDelta !== 0 ? dateDelta : b.createdAt - a.createdAt;
			}

			if (aHasDueDate) {
				return -1;
			}

			if (bHasDueDate) {
				return 1;
			}

			return b.createdAt - a.createdAt;
		}

		return b.createdAt - a.createdAt;
	});

	return sorted;
}

function formatDueDate(dateValue) {
	const date = new Date(`${dateValue}T00:00:00`);
	if (Number.isNaN(date.getTime())) {
		return "Invalid date";
	}

	return date.toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function capitalize(value) {
	if (!value) {
		return "";
	}

	return value[0].toUpperCase() + value.slice(1);
}

function escapeHtml(text) {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

